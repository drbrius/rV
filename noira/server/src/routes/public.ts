/* ============================================================
   Öffentliche Endpunkte — ohne Anmeldung erreichbar.

   Was hier herauskommt, geht in die Suche, die Detailseite und die
   Startseite. Der Zuschnitt der Antworten entspricht genau dem, was
   die Oberfläche anzeigt: keine Felder auf Vorrat, und vor allem
   keine, die niemanden ausserhalb angehen.
   ============================================================ */

import type { FastifyInstance } from "fastify";
import { z } from "zod";
import { one } from "../db/index.js";
import { badRequest, hashIp, notFound } from "../lib/http.js";
import {
  CANTONS,
  CATEGORIES,
  DURATIONS,
  LANGUAGES,
  LOCALES,
  PLANS,
  SERVICES,
  VAT_RATE_BP,
  codewordOfDay,
  priceOrder,
  type Duration,
  type PlanId,
} from "../domain/catalog.js";
import { countView, findBySlug, searchListings } from "../domain/listings.js";
import { createReport, REPORT_KINDS } from "../domain/reports.js";
import { siteStats } from "../domain/stats.js";

/** Kommaliste oder wiederholter Parameter — beides ist im Umlauf. */
const list = z
  .union([z.string(), z.array(z.string())])
  .optional()
  .transform((v) =>
    v === undefined
      ? undefined
      : (Array.isArray(v) ? v : v.split(","))
          .map((s) => s.trim())
          .filter(Boolean),
  );

const bool = z
  .union([z.string(), z.boolean()])
  .optional()
  .transform((v) => (v === undefined ? undefined : v === true || v === "1" || v === "true"));

const searchQuery = z.object({
  q: z.string().max(120).optional(),
  kanton: z.string().max(2).optional(),
  kategorie: z.string().max(32).optional(),
  services: list,
  sprachen: list,
  verifiziert: bool,
  video: bool,
  online: bool,
  empfang: bool,
  besuch: bool,
  preis: z.coerce.number().int().positive().optional(),
  sortierung: z.enum(["relevanz", "neu", "preis-auf", "preis-ab", "premium"]).optional(),
  page: z.coerce.number().int().positive().optional(),
  limit: z.coerce.number().int().positive().max(60).optional(),
});

export async function publicRoutes(app: FastifyInstance) {
  app.get("/api/health", async () => ({ status: "ok", time: new Date().toISOString() }));

  /* Der Katalog wird einmal geladen und füllt sämtliche Auswahlfelder.
     So steht die gültige Liste an genau einer Stelle — hier. */
  app.get("/api/catalog", async (_req, reply) => {
    reply.header("cache-control", "public, max-age=300");
    return {
      cantons: CANTONS,
      categories: CATEGORIES,
      services: SERVICES,
      languages: LANGUAGES,
      locales: LOCALES,
      durations: DURATIONS,
      vatRateBp: VAT_RATE_BP,
      plans: Object.fromEntries(
        Object.entries(PLANS).map(([id, p]) => [
          id,
          {
            photos: p.photos,
            videos: p.videos,
            featured: p.featured,
            regions: p.regions,
            /* Netto, Steuer und Total je Laufzeit — vorgerechnet,
               damit die Oberfläche nichts nachrechnen muss und die
               Anzeige nie vom Beleg abweicht. */
            price: Object.fromEntries(
              DURATIONS.map((d) => [d, priceOrder(id as PlanId, d as Duration)]),
            ),
          },
        ]),
      ),
      codewordOfDay: codewordOfDay(),
    };
  });

  app.get("/api/stats", async (_req, reply) => {
    reply.header("cache-control", "public, max-age=60");
    return siteStats();
  });

  app.get("/api/listings", async (req) => {
    const parsed = searchQuery.safeParse(req.query);
    if (!parsed.success) throw badRequest("Ungültige Suchparameter.", z.treeifyError(parsed.error));
    return searchListings(parsed.data);
  });

  app.get("/api/listings/:slug", async (req) => {
    const { slug } = req.params as { slug: string };
    const listing = findBySlug(slug);
    if (!listing) throw notFound("Dieses Inserat gibt es nicht (mehr).");
    countView(listing.id, "view");
    return listing;
  });

  /* Die Nummer erst auf Anforderung. Das ist kein Kunstgriff: Es
     hält Nummern aus automatisch abgegrasten Seiten heraus und macht
     die einzige Zahl messbar, die für Inserierende zählt. */
  app.post("/api/listings/:slug/kontakt", async (req) => {
    const { slug } = req.params as { slug: string };
    const row = one<{ id: string; phone: string; phone_hidden: number }>(
      "SELECT id, phone, phone_hidden FROM listings WHERE slug = ? AND status = 'active'",
      [slug],
    );
    if (!row) throw notFound("Dieses Inserat gibt es nicht (mehr).");
    countView(row.id, "reveal");
    return row.phone_hidden === 1
      ? { phone: null, hint: "Diese Person nimmt Anfragen nur über das Kontaktformular entgegen." }
      : { phone: row.phone, hint: null };
  });

  const reportBody = z.object({
    slug: z.string().max(80).optional(),
    listingRef: z.string().max(40).optional(),
    kind: z.enum(REPORT_KINDS),
    message: z.string().min(10).max(4000),
    email: z.email().optional(),
  });

  /* Meldungen laufen absichtlich ohne Anmeldung und mit grosszügigem
     Limit: Wer etwas Ernstes meldet, darf nicht an einer Sperre
     scheitern. */
  app.post(
    "/api/reports",
    { config: { rateLimit: { max: 20, timeWindow: "10 minutes" } } },
    async (req, reply) => {
      const parsed = reportBody.safeParse(req.body);
      if (!parsed.success) throw badRequest("Meldung unvollständig.", z.treeifyError(parsed.error));
      reply.code(201);
      return createReport({ ...parsed.data, ipHash: hashIp(req.ip) });
    },
  );
}
