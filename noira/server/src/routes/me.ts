/* ============================================================
   Der angemeldete Bereich: eigene Inserate, Bilder, Verifizierung,
   Bestellungen, Zahlen.

   Jeder Zugriff geht über die Kontonummer aus der Sitzung, nie über
   eine aus der Anfrage. Die Fachschicht prüft die Eigentümerschaft
   ein zweites Mal — doppelt, weil genau hier fremde Inserate
   verändert würden, wenn eine der beiden Prüfungen fehlt.
   ============================================================ */

import type { FastifyInstance } from "fastify";
import { z } from "zod";
import { badRequest } from "../lib/http.js";
import {
  createDraft,
  listOwn,
  getOwn,
  pause,
  remove,
  setOnline,
  submitForReview,
  updateDraft,
} from "../domain/ads.js";
import { addPhoto, removePhoto, reorderPhotos } from "../domain/photos.js";
import { createOrder, getOrder, listOrders } from "../domain/payments.js";
import { latestFor, submit as submitVerification } from "../domain/verification.js";
import { accountStats, listingStats } from "../domain/stats.js";
import { logAction } from "../domain/audit.js";
import { DURATIONS, type Duration, type PlanId } from "../domain/catalog.js";

const rates = z.object({
  m30: z.number().int().positive().nullable().optional(),
  h1: z.number().int().positive(),
  h2: z.number().int().positive().nullable().optional(),
  night: z.number().int().positive().nullable().optional(),
});

const adBody = z.object({
  name: z.string().max(60).optional(),
  age: z.number().int().min(18).max(99).optional(),
  category: z.string().max(32).optional(),
  canton: z.string().max(2).optional(),
  city: z.string().max(60).optional(),
  tagline: z.string().max(80).optional(),
  about: z.string().max(1200).optional(),
  services: z.array(z.string().max(40)).max(30).optional(),
  languages: z.array(z.string().max(30)).max(15).optional(),
  incall: z.boolean().optional(),
  outcall: z.boolean().optional(),
  rates: rates.partial({ h1: true }).optional(),
  availability: z.string().max(200).optional(),
  phone: z.string().max(30).optional(),
  phoneHidden: z.boolean().optional(),
});

export async function meRoutes(app: FastifyInstance) {
  app.addHook("onRequest", app.requireAuth);

  /* --- Inserate --------------------------------------------------- */

  app.get("/api/me/listings", async (req) => ({ items: listOwn(req.account!.id) }));

  app.get("/api/me/listings/:id", async (req) => {
    const { id } = req.params as { id: string };
    return getOwn(req.account!.id, id);
  });

  app.post("/api/me/listings", async (req, reply) => {
    const parsed = adBody.safeParse(req.body ?? {});
    if (!parsed.success) throw badRequest("Eingaben ungültig.", z.treeifyError(parsed.error));
    reply.code(201);
    const listing = createDraft(req.account!.id, parsed.data as never);
    logAction({
      actorId: req.account!.id,
      actorKind: "advertiser",
      action: "listing.created",
      subjectType: "listing",
      subjectId: listing.id,
    });
    return listing;
  });

  app.patch("/api/me/listings/:id", async (req) => {
    const { id } = req.params as { id: string };
    const parsed = adBody.safeParse(req.body ?? {});
    if (!parsed.success) throw badRequest("Eingaben ungültig.", z.treeifyError(parsed.error));
    return updateDraft(req.account!.id, id, parsed.data as never);
  });

  app.post("/api/me/listings/:id/einreichen", async (req) => {
    const { id } = req.params as { id: string };
    const listing = submitForReview(req.account!.id, id);
    logAction({
      actorId: req.account!.id,
      actorKind: "advertiser",
      action: "listing.submitted",
      subjectType: "listing",
      subjectId: id,
    });
    return listing;
  });

  app.post("/api/me/listings/:id/pause", async (req) => {
    const { id } = req.params as { id: string };
    const body = z.object({ paused: z.boolean() }).safeParse(req.body ?? {});
    if (!body.success) throw badRequest("`paused` fehlt.");
    return pause(req.account!.id, id, body.data.paused);
  });

  /* „Jetzt erreichbar" hat eine Frist statt eines Schalters: Ein
     Schalter bleibt an, wenn jemand ihn vergisst, und dann stimmt die
     Anzeige für alle anderen nicht mehr. */
  app.post("/api/me/listings/:id/erreichbar", async (req) => {
    const { id } = req.params as { id: string };
    const body = z.object({ minutes: z.number().int().min(0).max(720) }).safeParse(req.body ?? {});
    if (!body.success) throw badRequest("`minutes` zwischen 0 und 720.");
    setOnline(req.account!.id, id, body.data.minutes);
    return getOwn(req.account!.id, id);
  });

  app.delete("/api/me/listings/:id", async (req, reply) => {
    const { id } = req.params as { id: string };
    remove(req.account!.id, id);
    logAction({
      actorId: req.account!.id,
      actorKind: "advertiser",
      action: "listing.deleted",
      subjectType: "listing",
      subjectId: id,
    });
    reply.code(204);
    return null;
  });

  /* --- Bilder ------------------------------------------------------ */

  app.post("/api/me/listings/:id/fotos", async (req, reply) => {
    const { id } = req.params as { id: string };
    const file = await req.file();
    if (!file) throw badRequest("Keine Datei empfangen.");
    const data = await file.toBuffer();
    reply.code(201);
    return addPhoto(req.account!.id, id, data);
  });

  app.post("/api/me/listings/:id/fotos/reihenfolge", async (req) => {
    const { id } = req.params as { id: string };
    const body = z.object({ order: z.array(z.string()).max(60) }).safeParse(req.body ?? {});
    if (!body.success) throw badRequest("`order` fehlt.");
    reorderPhotos(req.account!.id, id, body.data.order);
    return getOwn(req.account!.id, id);
  });

  app.delete("/api/me/listings/:id/fotos/:photoId", async (req, reply) => {
    const { id, photoId } = req.params as { id: string; photoId: string };
    removePhoto(req.account!.id, id, photoId);
    reply.code(204);
    return null;
  });

  /* --- Verifizierung ------------------------------------------------ */

  app.get("/api/me/verifizierung", async (req) => latestFor(req.account!.id));

  app.post("/api/me/verifizierung", async (req, reply) => {
    const files: Record<string, { data: Buffer; mime: string }> = {};
    let listingId: string | null = null;

    for await (const part of req.parts()) {
      if (part.type === "file") {
        if (part.fieldname === "doc" || part.fieldname === "selfie") {
          files[part.fieldname] = { data: await part.toBuffer(), mime: part.mimetype };
        } else {
          // Ungelesene Teile blockieren den Strom.
          await part.toBuffer();
        }
      } else if (part.fieldname === "listingId") {
        listingId = String(part.value) || null;
      }
    }

    if (!files.doc || !files.selfie)
      throw badRequest("Ausweis und Selfie mit Codewort sind beide nötig.", {
        doc: files.doc ? undefined : "fehlt",
        selfie: files.selfie ? undefined : "fehlt",
      });

    reply.code(201);
    const result = submitVerification(req.account!.id, listingId, {
      doc: files.doc,
      selfie: files.selfie,
    });
    logAction({
      actorId: req.account!.id,
      actorKind: "advertiser",
      action: "verification.submitted",
      subjectType: "verification",
      subjectId: result.id,
    });
    return result;
  });

  /* --- Bestellungen -------------------------------------------------- */

  const orderBody = z.object({
    listingId: z.string().max(40).nullable().optional(),
    plan: z.enum(["basis", "plus", "premium"]),
    duration: z.union([z.literal(7), z.literal(30), z.literal(90)]),
    method: z.enum(["card", "twint", "crypto"]),
    asset: z.enum(["btc", "eth", "usdt"]).optional(),
    email: z.email().optional(),
    address: z
      .object({
        company: z.string().max(120).optional(),
        line1: z.string().max(120).optional(),
        zip: z.string().max(12).optional(),
        city: z.string().max(80).optional(),
        country: z.string().max(2).optional(),
      })
      .optional(),
  });

  app.get("/api/me/bestellungen", async (req) => ({ items: listOrders(req.account!.id) }));

  app.get("/api/me/bestellungen/:id", async (req) => {
    const { id } = req.params as { id: string };
    return getOrder(req.account!.id, id);
  });

  app.post("/api/me/bestellungen", async (req, reply) => {
    const parsed = orderBody.safeParse(req.body ?? {});
    if (!parsed.success) throw badRequest("Bestellung unvollständig.", z.treeifyError(parsed.error));
    const d = parsed.data;
    if (!DURATIONS.includes(d.duration as Duration)) throw badRequest("Ungültige Laufzeit.");

    reply.code(201);
    const result = createOrder({
      accountId: req.account!.id,
      listingId: d.listingId ?? null,
      plan: d.plan as PlanId,
      duration: d.duration as Duration,
      method: d.method,
      email: d.email ?? req.account!.email,
      asset: d.asset,
      address: d.address,
    });
    logAction({
      actorId: req.account!.id,
      actorKind: "advertiser",
      action: "order.created",
      subjectType: "order",
      subjectId: result.order.id,
      meta: { plan: d.plan, duration: d.duration, method: d.method },
    });
    return result;
  });

  /* --- Zahlen -------------------------------------------------------- */

  app.get("/api/me/statistik", async (req) => {
    const q = z.object({ days: z.coerce.number().int().optional() }).parse(req.query ?? {});
    return { listings: accountStats(req.account!.id, q.days ?? 30) };
  });

  app.get("/api/me/listings/:id/statistik", async (req) => {
    const { id } = req.params as { id: string };
    const q = z.object({ days: z.coerce.number().int().optional() }).parse(req.query ?? {});
    return listingStats(req.account!.id, id, q.days ?? 30);
  });
}
