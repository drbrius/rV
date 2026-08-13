import type { FastifyInstance } from "fastify";
import { buildApp } from "../src/app.js";
import { run } from "../src/db/index.js";
import { hashPassword } from "../src/lib/password.js";
import { newId } from "../src/lib/ids.js";
import { nowIso } from "../src/lib/http.js";
import { placeholderPhoto } from "../src/lib/placeholder.js";

export async function testApp(): Promise<FastifyInstance> {
  return buildApp();
}

/* `set-cookie` ist ein String, wenn es genau einen gibt, und ein
   Array, wenn es mehrere sind. Wer das nicht abfängt, liest bei
   einem einzelnen Cookie den ersten Buchstaben. */
function sessionCookie(headers: Record<string, unknown>): string {
  const raw = headers["set-cookie"];
  const first = Array.isArray(raw) ? (raw[0] as string) : (raw as string);
  if (!first) throw new Error("Keine Sitzung gesetzt.");
  return first.split(";")[0]!;
}

/** Meldet ein Konto an und liefert den Cookie-Kopf für weitere Aufrufe. */
export async function login(app: FastifyInstance, email: string, password: string) {
  const res = await app.inject({
    method: "POST",
    url: "/api/auth/anmelden",
    payload: { email, password },
  });
  if (res.statusCode !== 200) throw new Error(`Anmeldung fehlgeschlagen: ${res.body}`);
  return { cookie: sessionCookie(res.headers), body: res.json() };
}

export async function register(app: FastifyInstance, email: string, password = "sehr-langes-passwort") {
  const res = await app.inject({
    method: "POST",
    url: "/api/auth/registrieren",
    payload: { email, password, acceptedTerms: true },
  });
  if (res.statusCode !== 201) throw new Error(`Registrierung fehlgeschlagen: ${res.body}`);
  return {
    cookie: sessionCookie(res.headers),
    account: res.json().account as { id: string; email: string },
  };
}

/** Erzeugt ein Team-Konto direkt in der Datenbank — es gibt bewusst
    keinen Endpunkt, der Rollen vergibt. */
export function makeStaff(email: string, role: "moderator" | "admin", password: string) {
  const id = newId("acc");
  run(
    `INSERT INTO accounts (id, email, password_hash, role, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, ?)`,
    [id, email, hashPassword(password), role, nowIso(), nowIso()],
  );
  return id;
}

export const VALID_AD = {
  name: "Testperson",
  age: 29,
  category: "begleitung",
  canton: "ZH",
  city: "Zürich",
  tagline: "Ruhige Abende, gutes Gespräch, kein Zeitdruck.",
  about:
    "Eine ausreichend lange Beschreibung für die Prüfung, damit die Mindestlänge von achtzig Zeichen sicher erreicht wird und der Text auch inhaltlich etwas hergibt.",
  services: ["Dinner-Date", "GFE"],
  languages: ["Deutsch", "Englisch"],
  incall: true,
  outcall: false,
  rates: { h1: 45000 },
  availability: "Di–Sa, 16–02 Uhr",
  phone: "079 000 12 40",
};

/** Ein echtes PNG als Upload-Nutzlast. */
export function photoPayload(field = "file", filename = "bild.png") {
  const data = placeholderPhoto(0, 1, 40, 40);
  const boundary = "----noiratest";
  const head = Buffer.from(
    `--${boundary}\r\nContent-Disposition: form-data; name="${field}"; filename="${filename}"\r\n` +
      `Content-Type: image/png\r\n\r\n`,
  );
  const tail = Buffer.from(`\r\n--${boundary}--\r\n`);
  return {
    body: Buffer.concat([head, data, tail]),
    headers: { "content-type": `multipart/form-data; boundary=${boundary}` },
  };
}

/** Mehrteilige Nutzlast für die Verifizierung (Ausweis + Selfie). */
export function verificationPayload() {
  const boundary = "----noiraver";
  const parts: Buffer[] = [];
  for (const field of ["doc", "selfie"]) {
    parts.push(
      Buffer.from(
        `--${boundary}\r\nContent-Disposition: form-data; name="${field}"; filename="${field}.png"\r\n` +
          `Content-Type: image/png\r\n\r\n`,
      ),
      placeholderPhoto(1, field === "doc" ? 2 : 3, 40, 40),
      Buffer.from("\r\n"),
    );
  }
  parts.push(Buffer.from(`--${boundary}--\r\n`));
  return {
    body: Buffer.concat(parts),
    headers: { "content-type": `multipart/form-data; boundary=${boundary}` },
  };
}
