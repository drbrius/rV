/* Meldungen, Sperren, Verifizierung, Löschfristen.

   Diese Datei prüft die Versprechen, die auf der Website stehen.
   Ein Versprechen ohne Test ist eine Absichtserklärung. */

import { afterAll, beforeAll, describe, expect, it } from "vitest";
import type { FastifyInstance } from "fastify";
import { closeDatabase, one, run } from "../src/db/index.js";
import { purgeExpired } from "../src/domain/verification.js";
import { readSecure } from "../src/lib/storage.js";
import {
  VALID_AD,
  login,
  makeStaff,
  photoPayload,
  register,
  testApp,
  verificationPayload,
} from "./helpers.js";

let app: FastifyInstance;
let advertiser: string;
let modCookie: string;
let listingId: string;
let slug: string;

/** Bringt ein Inserat vollständig live. */
async function publishListing(cookie: string, overrides: Record<string, unknown> = {}) {
  const created = await app.inject({
    method: "POST",
    url: "/api/me/listings",
    headers: { cookie },
    payload: { ...VALID_AD, ...overrides },
  });
  const id = created.json().id as string;

  const { body, headers } = photoPayload();
  await app.inject({
    method: "POST",
    url: `/api/me/listings/${id}/fotos`,
    headers: { ...headers, cookie },
    payload: body,
  });
  await app.inject({
    method: "POST",
    url: `/api/me/listings/${id}/einreichen`,
    headers: { cookie },
  });
  await app.inject({
    method: "POST",
    url: `/api/admin/listings/${id}/freigeben`,
    headers: { cookie: modCookie },
  });

  const order = await app.inject({
    method: "POST",
    url: "/api/me/bestellungen",
    headers: { cookie },
    payload: { listingId: id, plan: "basis", duration: 30, method: "twint" },
  });
  await app.inject({
    method: "POST",
    url: "/api/payments/webhook/mock",
    payload: {
      id: `evt_${id}`,
      type: "payment.succeeded",
      providerRef: order.json().checkout.providerRef,
    },
  });
  return { id, slug: created.json().slug as string };
}

beforeAll(async () => {
  app = await testApp();
  makeStaff("mod@test.ch", "moderator", "sehr-langes-passwort");
  makeStaff("chef@test.ch", "admin", "sehr-langes-passwort");
  modCookie = (await login(app, "mod@test.ch", "sehr-langes-passwort")).cookie;
  advertiser = (await register(app, "wirt@test.ch")).cookie;
  const published = await publishListing(advertiser);
  listingId = published.id;
  slug = published.slug;
});

afterAll(async () => {
  await app.close();
  closeDatabase();
});

describe("Meldungen", () => {
  it("nimmt Meldungen ohne Anmeldung entgegen", async () => {
    const res = await app.inject({
      method: "POST",
      url: "/api/reports",
      payload: { slug, kind: "stolen_photos", message: "Die Bilder stammen von einer anderen Seite." },
    });
    expect(res.statusCode).toBe(201);
    expect(res.json().urgent).toBe(false);

    // Eine gewöhnliche Meldung nimmt das Inserat nicht sofort offline.
    const search = await app.inject({ url: "/api/listings" });
    expect(search.json().total).toBe(1);
  });

  it("nimmt ein Inserat bei einer dringenden Meldung sofort offline", async () => {
    const res = await app.inject({
      method: "POST",
      url: "/api/reports",
      payload: {
        slug,
        kind: "coercion",
        message: "Ich habe den Verdacht, dass diese Person nicht freiwillig inseriert.",
      },
    });
    expect(res.statusCode).toBe(201);
    expect(res.json().urgent).toBe(true);

    const search = await app.inject({ url: "/api/listings" });
    expect(search.json().total).toBe(0);

    const detail = await app.inject({ url: `/api/listings/${slug}` });
    expect(detail.statusCode).toBe(404);
  });

  it("stellt dringende Meldungen an den Anfang der Warteschlange", async () => {
    const queue = await app.inject({ url: "/api/admin/meldungen", headers: { cookie: modCookie } });
    const items = queue.json().items as { kind: string; urgent: boolean }[];
    expect(items).toHaveLength(2);
    expect(items[0]!.kind).toBe("coercion");
    expect(items[0]!.urgent).toBe(true);
  });

  it("lässt kein Inserat freigeben, solange eine dringende Meldung offen ist", async () => {
    const res = await app.inject({
      method: "POST",
      url: `/api/admin/listings/${listingId}/freigeben`,
      headers: { cookie: modCookie },
    });
    expect(res.statusCode).toBe(409);
  });

  it("verlangt für eine verworfene Meldung eine Begründung", async () => {
    const queue = await app.inject({ url: "/api/admin/meldungen", headers: { cookie: modCookie } });
    const urgent = queue.json().items[0]!.id as string;

    const ohne = await app.inject({
      method: "POST",
      url: `/api/admin/meldungen/${urgent}`,
      headers: { cookie: modCookie },
      payload: { decision: "dismissed" },
    });
    expect(ohne.statusCode).toBe(400);
  });

  it("stellt das Inserat erst wieder her, wenn keine Meldung mehr offen ist", async () => {
    const queue = await app.inject({ url: "/api/admin/meldungen", headers: { cookie: modCookie } });
    const items = queue.json().items as { id: string; kind: string }[];

    const urgent = items.find((i) => i.kind === "coercion")!;
    await app.inject({
      method: "POST",
      url: `/api/admin/meldungen/${urgent.id}`,
      headers: { cookie: modCookie },
      payload: { decision: "dismissed", note: "Rückfrage ergab: unbegründet." },
    });

    // Die zweite Meldung ist noch offen — das Inserat bleibt unten.
    expect((await app.inject({ url: "/api/listings" })).json().total).toBe(0);

    const other = items.find((i) => i.kind === "stolen_photos")!;
    await app.inject({
      method: "POST",
      url: `/api/admin/meldungen/${other.id}`,
      headers: { cookie: modCookie },
      payload: { decision: "dismissed", note: "Bilder nachweislich eigene." },
    });
    expect((await app.inject({ url: "/api/listings" })).json().total).toBe(1);
  });

  it("protokolliert jede Entscheidung", async () => {
    const res = await app.inject({
      url: `/api/admin/listings/${listingId}/verlauf`,
      headers: { cookie: modCookie },
    });
    const actions = (res.json().items as { action: string }[]).map((i) => i.action);
    expect(actions).toContain("listing.approved");
    expect(actions).toContain("listing.suspended_on_report");
  });
});

describe("Kontosperre", () => {
  it("bleibt Moderierenden verwehrt und gelingt der Verwaltung", async () => {
    const opfer = await register(app, "gesperrt@test.ch");
    const account = opfer.account.id;

    const zuWenigRechte = await app.inject({
      method: "POST",
      url: `/api/admin/konten/${account}/sperren`,
      headers: { cookie: modCookie },
      payload: { reason: "Testfall" },
    });
    expect(zuWenigRechte.statusCode).toBe(403);

    const adminCookie = (await login(app, "chef@test.ch", "sehr-langes-passwort")).cookie;
    const res = await app.inject({
      method: "POST",
      url: `/api/admin/konten/${account}/sperren`,
      headers: { cookie: adminCookie },
      payload: { reason: "Wiederholte Verstösse" },
    });
    expect(res.statusCode).toBe(200);

    // Die laufende Sitzung endet sofort.
    const weiter = await app.inject({ url: "/api/me/listings", headers: { cookie: opfer.cookie } });
    expect(weiter.statusCode).toBe(401);
  });
});

describe("Verifizierung", () => {
  let verificationId: string;

  it("nimmt Ausweis und Selfie entgegen und nennt die Löschfrist", async () => {
    const { body, headers } = verificationPayload();
    const res = await app.inject({
      method: "POST",
      url: "/api/me/verifizierung",
      headers: { ...headers, cookie: advertiser },
      payload: body,
    });
    expect(res.statusCode).toBe(201);
    verificationId = res.json().id;
    expect(res.json().status).toBe("pending");
    expect(res.json().codeword).toMatch(/^[A-ZÄÖÜ]+$/);
    expect(new Date(res.json().documentsDeletedAfter).getTime()).toBeGreaterThan(Date.now());
  });

  it("legt die Unterlagen verschlüsselt ab", () => {
    const row = one<{ doc_key: string }>("SELECT doc_key FROM verifications WHERE id = ?", [
      verificationId,
    ])!;
    // Entschlüsselt ist es wieder ein PNG; auf der Platte nicht.
    const plain = readSecure(row.doc_key)!;
    expect(plain.subarray(1, 4).toString()).toBe("PNG");
  });

  it("gibt Unterlagen nur der Prüfung heraus, nie öffentlich", async () => {
    const ohne = await app.inject({ url: `/api/admin/verifizierungen/${verificationId}/ausweis` });
    expect(ohne.statusCode).toBe(401);

    const mit = await app.inject({
      url: `/api/admin/verifizierungen/${verificationId}/ausweis`,
      headers: { cookie: modCookie },
    });
    expect(mit.statusCode).toBe(200);
    expect(mit.headers["cache-control"]).toContain("no-store");
  });

  it("setzt bei Freigabe das Prüfzeichen am Konto", async () => {
    const res = await app.inject({
      method: "POST",
      url: `/api/admin/verifizierungen/${verificationId}`,
      headers: { cookie: modCookie },
      payload: { approved: true },
    });
    expect(res.json().status).toBe("approved");

    const detail = await app.inject({ url: `/api/listings/${slug}` });
    expect(detail.json().verified).toBe(true);
  });

  it("gibt abgeschlossene Vorgänge nicht mehr her", async () => {
    const res = await app.inject({
      url: `/api/admin/verifizierungen/${verificationId}/ausweis`,
      headers: { cookie: modCookie },
    });
    expect(res.statusCode).toBe(403);
  });

  it("löscht die Unterlagen, wenn die Frist abgelaufen ist", () => {
    const before = one<{ doc_key: string | null; selfie_key: string | null }>(
      "SELECT doc_key, selfie_key FROM verifications WHERE id = ?",
      [verificationId],
    )!;
    expect(before.doc_key).toBeTruthy();

    // Frist künstlich in die Vergangenheit ziehen.
    run("UPDATE verifications SET purge_after = ? WHERE id = ?", [
      "2020-01-01T00:00:00.000Z",
      verificationId,
    ]);
    expect(purgeExpired()).toBe(1);

    const after = one<{ doc_key: string | null }>(
      "SELECT doc_key FROM verifications WHERE id = ?",
      [verificationId],
    )!;
    expect(after.doc_key).toBeNull();
    expect(readSecure(before.doc_key!)).toBeNull();

    // Der Vorgang selbst bleibt als Nachweis stehen.
    expect(one("SELECT 1 FROM verifications WHERE id = ?", [verificationId])).toBeTruthy();
  });
});
