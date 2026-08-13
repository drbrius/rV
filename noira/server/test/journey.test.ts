/* Der ganze Weg eines Inserats, in einem Test:
   Konto → Entwurf → Foto → Einreichen → Prüfung → Zahlung →
   öffentlich sichtbar.

   Getestet wird dabei die Regel, an der die Plattform hängt: Weder
   Geld allein noch Freigabe allein schalten ein Inserat frei. */

import { afterAll, beforeAll, describe, expect, it } from "vitest";
import type { FastifyInstance } from "fastify";
import { closeDatabase } from "../src/db/index.js";
import { VALID_AD, login, makeStaff, photoPayload, register, testApp } from "./helpers.js";

let app: FastifyInstance;
let advertiser: string;
let listingId: string;
let modCookie: string;

beforeAll(async () => {
  app = await testApp();
  makeStaff("mod@test.ch", "moderator", "sehr-langes-passwort");
});

afterAll(async () => {
  await app.close();
  closeDatabase();
});

describe("Weg eines Inserats", () => {
  it("legt ein Konto an und meldet an", async () => {
    const { cookie } = await register(app, "wirt@test.ch");
    advertiser = cookie;
    const me = await app.inject({ url: "/api/auth/ich", headers: { cookie } });
    expect(me.json().account.email).toBe("wirt@test.ch");
  });

  it("legt einen Entwurf an", async () => {
    const res = await app.inject({
      method: "POST",
      url: "/api/me/listings",
      headers: { cookie: advertiser },
      payload: VALID_AD,
    });
    expect(res.statusCode).toBe(201);
    listingId = res.json().id;
    expect(res.json().status).toBe("draft");
    expect(res.json().slug).toBe("testperson-zuerich");
  });

  it("verweigert das Einreichen ohne Foto", async () => {
    const res = await app.inject({
      method: "POST",
      url: `/api/me/listings/${listingId}/einreichen`,
      headers: { cookie: advertiser },
    });
    expect(res.statusCode).toBe(400);
    expect(res.json().errors.photos).toBeTruthy();
  });

  it("nimmt ein Foto entgegen — noch nicht freigegeben", async () => {
    const { body, headers } = photoPayload();
    const res = await app.inject({
      method: "POST",
      url: `/api/me/listings/${listingId}/fotos`,
      headers: { ...headers, cookie: advertiser },
      payload: body,
    });
    expect(res.statusCode).toBe(201);
    expect(res.json().approved).toBe(false);
  });

  it("weist eine Datei ab, die nur behauptet, ein Bild zu sein", async () => {
    const boundary = "----x";
    const payload = Buffer.concat([
      Buffer.from(
        `--${boundary}\r\nContent-Disposition: form-data; name="file"; filename="bild.png"\r\n` +
          `Content-Type: image/png\r\n\r\n`,
      ),
      Buffer.from("<?php echo 'kein Bild'; ?>                    "),
      Buffer.from(`\r\n--${boundary}--\r\n`),
    ]);
    const res = await app.inject({
      method: "POST",
      url: `/api/me/listings/${listingId}/fotos`,
      headers: { "content-type": `multipart/form-data; boundary=${boundary}`, cookie: advertiser },
      payload,
    });
    expect(res.statusCode).toBe(400);
  });

  it("reicht ein", async () => {
    const res = await app.inject({
      method: "POST",
      url: `/api/me/listings/${listingId}/einreichen`,
      headers: { cookie: advertiser },
    });
    expect(res.statusCode).toBe(200);
    expect(res.json().status).toBe("pending_review");
  });

  it("zeigt das Inserat noch nicht öffentlich", async () => {
    const res = await app.inject({ url: "/api/listings" });
    expect(res.json().total).toBe(0);
  });

  it("lässt Fremde nicht in die Moderation", async () => {
    const res = await app.inject({ url: "/api/admin/pruefung", headers: { cookie: advertiser } });
    expect(res.statusCode).toBe(403);
  });

  it("gibt frei — bleibt aber unsichtbar, weil nicht bezahlt", async () => {
    modCookie = (await login(app, "mod@test.ch", "sehr-langes-passwort")).cookie;
    const queue = await app.inject({ url: "/api/admin/pruefung", headers: { cookie: modCookie } });
    expect(queue.json().items).toHaveLength(1);

    const res = await app.inject({
      method: "POST",
      url: `/api/admin/listings/${listingId}/freigeben`,
      headers: { cookie: modCookie },
    });
    expect(res.json()).toMatchObject({ reviewed: true, published: false, waitingFor: "payment" });

    const search = await app.inject({ url: "/api/listings" });
    expect(search.json().total).toBe(0);
  });

  it("schaltet nach der Zahlung frei", async () => {
    const order = await app.inject({
      method: "POST",
      url: "/api/me/bestellungen",
      headers: { cookie: advertiser },
      payload: { listingId, plan: "plus", duration: 30, method: "card" },
    });
    expect(order.statusCode).toBe(201);
    const { order: created, checkout } = order.json();
    // Der Betrag kommt aus dem Katalog, nicht aus der Anfrage.
    expect(created.amount.total).toBe(16_105);

    const paid = await app.inject({
      method: "POST",
      url: "/api/payments/webhook/mock",
      payload: {
        id: "evt_1",
        type: "payment.succeeded",
        providerRef: checkout.providerRef,
      },
    });
    expect(paid.statusCode).toBe(200);
    expect(paid.json()).toMatchObject({ matched: true, duplicate: false });

    const search = await app.inject({ url: "/api/listings" });
    expect(search.json().total).toBe(1);
    expect(search.json().items[0].name).toBe("Testperson");
    // Mit der Freigabe ist auch das Bild sichtbar.
    expect(search.json().items[0].photos).toHaveLength(1);
  });

  it("verlängert bei doppelt geliefertem Ereignis kein zweites Mal", async () => {
    const before = await app.inject({
      url: `/api/me/listings/${listingId}`,
      headers: { cookie: advertiser },
    });
    const again = await app.inject({
      method: "POST",
      url: "/api/payments/webhook/mock",
      payload: { id: "evt_1", type: "payment.succeeded", providerRef: "egal" },
    });
    expect(again.json().duplicate).toBe(true);

    const after = await app.inject({
      url: `/api/me/listings/${listingId}`,
      headers: { cookie: advertiser },
    });
    expect(after.json().expiresAt).toBe(before.json().expiresAt);
  });

  it("gibt die Nummer erst auf Anforderung heraus und zählt das", async () => {
    const slug = "testperson-zuerich";
    const detail = await app.inject({ url: `/api/listings/${slug}` });
    expect(detail.json().phone).toBeUndefined();

    const contact = await app.inject({ method: "POST", url: `/api/listings/${slug}/kontakt` });
    expect(contact.json().phone).toBe("079 000 12 40");

    const stats = await app.inject({
      url: `/api/me/listings/${listingId}/statistik`,
      headers: { cookie: advertiser },
    });
    expect(stats.json().totals.reveals).toBe(1);
    expect(stats.json().totals.views).toBeGreaterThanOrEqual(1);
    expect(stats.json().series).toHaveLength(30);
  });

  it("schickt inhaltliche Änderungen zurück in die Prüfung", async () => {
    const res = await app.inject({
      method: "PATCH",
      url: `/api/me/listings/${listingId}`,
      headers: { cookie: advertiser },
      payload: { about: "Ein vollständig anderer Text, der erneut geprüft werden muss." },
    });
    expect(res.json().status).toBe("pending_review");
    const search = await app.inject({ url: "/api/listings" });
    expect(search.json().total).toBe(0);
  });

  it("lässt niemanden fremde Inserate bearbeiten", async () => {
    const { cookie } = await register(app, "fremd@test.ch");
    const res = await app.inject({
      method: "PATCH",
      url: `/api/me/listings/${listingId}`,
      headers: { cookie },
      payload: { city: "Bern" },
    });
    expect(res.statusCode).toBe(403);
  });
});
