/* ============================================================
   Moderation und Verwaltung

   Alles hier setzt eine Rolle voraus, und alles hier wird
   protokolliert. Der heikelste Endpunkt ist der letzte: Ausweise
   ansehen. Er liefert die Datei nur entschlüsselt aus, schreibt
   jeden Abruf ins Protokoll und verbietet dem Browser, sie zu
   behalten.
   ============================================================ */

import type { FastifyInstance } from "fastify";
import { z } from "zod";
import { one } from "../db/index.js";
import { badRequest, forbidden, notFound } from "../lib/http.js";
import { readSecure } from "../lib/storage.js";
import { historyOf, logAction } from "../domain/audit.js";
import {
  approveListing,
  disableAccount,
  enableAccount,
  rejectListing,
  reviewQueue,
  setPhotoApproval,
  suspendListing,
} from "../domain/moderation.js";
import { handleReport, openReports } from "../domain/reports.js";
import { adminStats } from "../domain/stats.js";
import { decide, pendingQueue } from "../domain/verification.js";

const reason = z.object({ reason: z.string().min(3).max(500) });

export async function adminRoutes(app: FastifyInstance) {
  app.addHook("onRequest", app.requireRole("moderator", "admin"));

  app.get("/api/admin/uebersicht", async () => adminStats());

  /* --- Inserate ----------------------------------------------------- */

  app.get("/api/admin/pruefung", async () => ({ items: reviewQueue() }));

  app.post("/api/admin/listings/:id/freigeben", async (req) => {
    const { id } = req.params as { id: string };
    return approveListing(id, req.account!.id);
  });

  app.post("/api/admin/listings/:id/ablehnen", async (req) => {
    const { id } = req.params as { id: string };
    const body = reason.safeParse(req.body ?? {});
    if (!body.success) throw badRequest("Ein Grund ist Pflicht.", z.treeifyError(body.error));
    return rejectListing(id, req.account!.id, body.data.reason);
  });

  app.post("/api/admin/listings/:id/sperren", async (req) => {
    const { id } = req.params as { id: string };
    const body = reason.safeParse(req.body ?? {});
    if (!body.success) throw badRequest("Ein Grund ist Pflicht.", z.treeifyError(body.error));
    return suspendListing(id, req.account!.id, body.data.reason);
  });

  app.post("/api/admin/fotos/:photoId", async (req) => {
    const { photoId } = req.params as { photoId: string };
    const body = z.object({ approved: z.boolean() }).safeParse(req.body ?? {});
    if (!body.success) throw badRequest("`approved` fehlt.");
    return setPhotoApproval(photoId, req.account!.id, body.data.approved);
  });

  app.get("/api/admin/listings/:id/verlauf", async (req) => {
    const { id } = req.params as { id: string };
    return { items: historyOf("listing", id) };
  });

  /* --- Meldungen ----------------------------------------------------- */

  app.get("/api/admin/meldungen", async () => ({ items: openReports() }));

  app.post("/api/admin/meldungen/:id", async (req) => {
    const { id } = req.params as { id: string };
    const body = z
      .object({
        decision: z.enum(["actioned", "dismissed", "in_review"]),
        note: z.string().max(1000).optional(),
      })
      .safeParse(req.body ?? {});
    if (!body.success) throw badRequest("Entscheidung fehlt.", z.treeifyError(body.error));
    return handleReport(id, req.account!.id, body.data.decision, body.data.note);
  });

  /* --- Verifizierungen ------------------------------------------------ */

  app.get("/api/admin/verifizierungen", async () => ({ items: pendingQueue() }));

  app.post("/api/admin/verifizierungen/:id", async (req) => {
    const { id } = req.params as { id: string };
    const body = z
      .object({ approved: z.boolean(), reason: z.string().max(500).optional() })
      .safeParse(req.body ?? {});
    if (!body.success) throw badRequest("Entscheidung fehlt.", z.treeifyError(body.error));
    const result = decide(id, req.account!.id, body.data.approved, body.data.reason);
    logAction({
      actorId: req.account!.id,
      actorKind: "moderator",
      action: `verification.${result.status}`,
      subjectType: "verification",
      subjectId: id,
    });
    return result;
  });

  /**
   * Ausweis oder Selfie ansehen.
   *
   * Nur für laufende Vorgänge, nur einzeln, jeder Abruf im
   * Protokoll. Nach der Aufbewahrungsfrist gibt es hier nichts mehr
   * zu sehen — nicht weil der Zugriff gesperrt wäre, sondern weil
   * die Datei gelöscht ist.
   */
  app.get("/api/admin/verifizierungen/:id/:art", async (req, reply) => {
    const { id, art } = req.params as { id: string; art: string };
    if (art !== "ausweis" && art !== "selfie") throw notFound();

    const row = one<{ doc_key: string | null; selfie_key: string | null; status: string }>(
      "SELECT doc_key, selfie_key, status FROM verifications WHERE id = ?",
      [id],
    );
    if (!row) throw notFound("Prüfvorgang nicht gefunden.");
    if (row.status !== "pending")
      throw forbidden("Abgeschlossene Vorgänge geben keine Unterlagen mehr heraus.");

    const key = art === "ausweis" ? row.doc_key : row.selfie_key;
    if (!key) throw notFound("Die Unterlagen wurden bereits gelöscht.");
    const data = readSecure(key);
    if (!data) throw notFound("Die Unterlagen wurden bereits gelöscht.");

    logAction({
      actorId: req.account!.id,
      actorKind: "moderator",
      action: "verification.document_viewed",
      subjectType: "verification",
      subjectId: id,
      meta: { art },
    });

    reply
      .header("content-type", "image/jpeg")
      .header("cache-control", "no-store, private")
      .header("content-disposition", "inline");
    return data;
  });

  /* --- Konten --------------------------------------------------------- */

  app.post(
    "/api/admin/konten/:id/sperren",
    { onRequest: [app.requireRole("admin")] },
    async (req) => {
      const { id } = req.params as { id: string };
      const body = reason.safeParse(req.body ?? {});
      if (!body.success) throw badRequest("Ein Grund ist Pflicht.", z.treeifyError(body.error));
      return disableAccount(id, req.account!.id, body.data.reason);
    },
  );

  app.post(
    "/api/admin/konten/:id/entsperren",
    { onRequest: [app.requireRole("admin")] },
    async (req) => {
      const { id } = req.params as { id: string };
      return enableAccount(id, req.account!.id);
    },
  );
}
