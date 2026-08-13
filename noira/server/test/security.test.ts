/* Was die Plattform vor Missbrauch schützt — und was sie über ihre
   Nutzenden preisgibt. Diese Tests sind der Grund, warum die
   entsprechenden Stellen im Code so umständlich aussehen. */

import { afterAll, beforeAll, describe, expect, it } from "vitest";
import type { FastifyInstance } from "fastify";
import { closeDatabase, one } from "../src/db/index.js";
import { authenticate } from "../src/domain/accounts.js";
import { AppError } from "../src/lib/http.js";
import { hashPassword, needsRehash, verifyPassword } from "../src/lib/password.js";
import { register, testApp } from "./helpers.js";

let app: FastifyInstance;

beforeAll(async () => {
  app = await testApp();
});
afterAll(async () => {
  await app.close();
  closeDatabase();
});

describe("Passwörter", () => {
  it("legt niemals das Passwort selbst ab", async () => {
    await register(app, "hash@test.ch", "ein-langes-passwort");
    const row = one<{ password_hash: string }>(
      "SELECT password_hash FROM accounts WHERE email = ?",
      ["hash@test.ch"],
    )!;
    expect(row.password_hash).not.toContain("ein-langes-passwort");
    expect(row.password_hash.startsWith("scrypt$")).toBe(true);
  });

  it("erzeugt für dasselbe Passwort verschiedene Hashes", () => {
    const a = hashPassword("gleiches-passwort");
    const b = hashPassword("gleiches-passwort");
    expect(a).not.toBe(b);
    expect(verifyPassword("gleiches-passwort", a)).toBe(true);
    expect(verifyPassword("gleiches-passwort", b)).toBe(true);
    expect(verifyPassword("anderes-passwort", a)).toBe(false);
  });

  it("erkennt veraltete Parameter", () => {
    expect(needsRehash(hashPassword("x-langes-passwort"))).toBe(false);
    expect(needsRehash("scrypt$1024$8$1$AAAA$BBBB")).toBe(true);
  });
});

describe("Anmeldung", () => {
  it("sagt bei falschem Passwort dasselbe wie bei unbekannter Adresse", async () => {
    await register(app, "bekannt@test.ch", "richtiges-passwort");

    const falsch = await app.inject({
      method: "POST",
      url: "/api/auth/anmelden",
      payload: { email: "bekannt@test.ch", password: "falsches-passwort" },
    });
    const unbekannt = await app.inject({
      method: "POST",
      url: "/api/auth/anmelden",
      payload: { email: "gibtsnicht@test.ch", password: "falsches-passwort" },
    });

    expect(falsch.statusCode).toBe(401);
    expect(unbekannt.statusCode).toBe(401);
    // Gleiche Antwort — sonst ist die Anmeldung ein Adressverzeichnis.
    expect(falsch.json().title).toBe(unbekannt.json().title);
  });

  it("sperrt nach zu vielen Fehlversuchen — je Konto gezählt", () => {
    const email = "sperre@test.ch";
    hashPassword("egal");
    let blocked = 0;
    for (let i = 0; i < 12; i++) {
      try {
        authenticate(email, "falsch", "ip-a");
      } catch (err) {
        if (err instanceof AppError && err.status === 429) blocked++;
      }
    }
    expect(blocked).toBeGreaterThan(0);

    /* Eine andere Herkunft mit einer anderen Adresse darf davon
       nichts merken — sonst legt ein Angriff die Anmeldung für alle
       lahm. */
    let otherBlocked = false;
    try {
      authenticate("jemand-anderes@test.ch", "falsch", "ip-b");
    } catch (err) {
      otherBlocked = err instanceof AppError && err.status === 429;
    }
    expect(otherBlocked).toBe(false);
  });

  it("speichert das Sitzungstoken nur als Hash", async () => {
    const { cookie } = await register(app, "sitzung@test.ch");
    const token = cookie.split("=")[1]!;
    const row = one<{ n: number }>("SELECT COUNT(*) AS n FROM sessions WHERE token_hash = ?", [
      token,
    ])!;
    expect(row.n).toBe(0);
    expect(one("SELECT 1 FROM sessions")).toBeTruthy();
  });

  it("beendet die Sitzung beim Abmelden", async () => {
    const { cookie } = await register(app, "tschuess@test.ch");
    await app.inject({ method: "POST", url: "/api/auth/abmelden", headers: { cookie } });
    const res = await app.inject({ url: "/api/me/listings", headers: { cookie } });
    expect(res.statusCode).toBe(401);
  });

  it("setzt ein Cookie, das JavaScript nicht lesen kann", async () => {
    const res = await app.inject({
      method: "POST",
      url: "/api/auth/registrieren",
      payload: { email: "cookie@test.ch", password: "sehr-langes-passwort", acceptedTerms: true },
    });
    const raw = res.headers["set-cookie"];
    const header = Array.isArray(raw) ? raw[0]! : (raw as string);
    expect(header.toLowerCase()).toContain("httponly");
    expect(header.toLowerCase()).toContain("samesite=lax");
  });
});

describe("Antwort-Kopfzeilen", () => {
  it("verbietet Einbettung und MIME-Raten", async () => {
    const res = await app.inject({ url: "/api/health" });
    expect(res.headers["x-frame-options"]).toBe("DENY");
    expect(res.headers["x-content-type-options"]).toBe("nosniff");
    expect(res.headers["referrer-policy"]).toBe("no-referrer");
  });

  it("antwortet auf Fehler im Problem-Format", async () => {
    const res = await app.inject({ url: "/api/gibtsnicht" });
    expect(res.statusCode).toBe(404);
    expect(res.headers["content-type"]).toContain("application/problem+json");
    expect(res.json()).toMatchObject({ status: 404, code: "not_found" });
  });
});
