/* ============================================================
   Meldungen

   Der wichtigste Endpunkt der ganzen Plattform, und der einzige,
   der ohne Konto erreichbar sein muss. Wer Zwang oder eine
   minderjährige Person meldet, hat sich nicht vorher registriert.

   Darum:
   • kein Login, keine Pflicht zur Adresse;
   • zwei Meldungsarten gelten sofort als dringend und schieben sich
     in der Warteschlange nach vorn;
   • bei diesen beiden wird das Inserat unverzüglich aus der Suche
     genommen, bevor ein Mensch draufschaut. Ein zu Unrecht
     gesperrtes Inserat kostet Geld; das andere Versäumnis kostet
     mehr.
   ============================================================ */

import { all, one, run, tx } from "../db/index.js";
import { badRequest, notFound, nowIso } from "../lib/http.js";
import { newId } from "../lib/ids.js";
import { logAction } from "./audit.js";

export const REPORT_KINDS = [
  "coercion",
  "minor",
  "stolen_photos",
  "fraud",
  "harassment",
  "other",
] as const;
export type ReportKind = (typeof REPORT_KINDS)[number];

/** Diese beiden warten auf niemanden. */
export const URGENT: ReportKind[] = ["coercion", "minor"];

export type ReportRow = {
  id: string;
  listing_id: string | null;
  listing_ref: string | null;
  kind: ReportKind;
  message: string;
  reporter_email: string | null;
  ip_hash: string | null;
  status: "open" | "in_review" | "actioned" | "dismissed";
  created_at: string;
  handled_at: string | null;
  handled_by: string | null;
  action_note: string | null;
};

export function createReport(input: {
  slug?: string | null;
  listingRef?: string | null;
  kind: string;
  message: string;
  email?: string | null;
  ipHash: string;
}) {
  if (!(REPORT_KINDS as readonly string[]).includes(input.kind))
    throw badRequest("Unbekannte Art der Meldung.");
  const message = input.message.trim();
  if (message.length < 10) throw badRequest("Bitte kurz schildern, worum es geht.");
  if (message.length > 4000) throw badRequest("Die Schilderung ist zu lang (max. 4000 Zeichen).");

  const listing = input.slug
    ? one<{ id: string }>("SELECT id FROM listings WHERE slug = ?", [input.slug])
    : undefined;

  const id = newId("rep");
  const kind = input.kind as ReportKind;

  tx(() => {
    run(
      `INSERT INTO reports
         (id, listing_id, listing_ref, kind, message, reporter_email, ip_hash, status, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, 'open', ?)`,
      [
        id,
        listing?.id ?? null,
        input.listingRef ?? input.slug ?? null,
        kind,
        message,
        input.email?.trim().toLowerCase() || null,
        input.ipHash,
        nowIso(),
      ],
    );

    /* Sofortmassnahme bei den beiden schweren Fällen: erst vom Netz,
       dann prüfen. */
    if (listing && URGENT.includes(kind)) {
      run("UPDATE listings SET status = 'suspended', updated_at = ? WHERE id = ?", [
        nowIso(),
        listing.id,
      ]);
      logAction({
        actorKind: "system",
        action: "listing.suspended_on_report",
        subjectType: "listing",
        subjectId: listing.id,
        meta: { reportId: id, kind },
      });
    }

    logAction({
      actorKind: "anonymous",
      action: "report.created",
      subjectType: "report",
      subjectId: id,
      meta: { kind, listingId: listing?.id ?? null },
      ipHash: input.ipHash,
    });
  });

  return {
    id,
    urgent: URGENT.includes(kind),
    /* Was jetzt passiert, gehört in die Antwort: Wer meldet, soll
       nicht raten müssen, ob es angekommen ist. */
    acknowledgement: URGENT.includes(kind)
      ? "Ihre Meldung ist eingegangen. Das Inserat wurde sofort offline genommen und wird umgehend geprüft."
      : "Ihre Meldung ist eingegangen und wird innerhalb von 24 Stunden geprüft.",
  };
}

/** Warteschlange: dringende zuerst, dann die ältesten. */
export function openReports(limit = 100) {
  return all<ReportRow & { slug: string | null; listing_name: string | null }>(
    `SELECT r.*, l.slug, l.name AS listing_name
       FROM reports r LEFT JOIN listings l ON l.id = r.listing_id
      WHERE r.status IN ('open','in_review')
      ORDER BY CASE WHEN r.kind IN ('coercion','minor') THEN 0 ELSE 1 END, r.created_at
      LIMIT ?`,
    [limit],
  ).map((r) => ({
    id: r.id,
    kind: r.kind,
    urgent: URGENT.includes(r.kind),
    message: r.message,
    status: r.status,
    createdAt: r.created_at,
    reporterEmail: r.reporter_email,
    listing: r.listing_id ? { id: r.listing_id, slug: r.slug, name: r.listing_name } : null,
    listingRef: r.listing_ref,
  }));
}

export function handleReport(
  id: string,
  moderatorId: string,
  decision: "actioned" | "dismissed" | "in_review",
  note?: string,
) {
  const row = one<ReportRow>("SELECT * FROM reports WHERE id = ?", [id]);
  if (!row) throw notFound("Meldung nicht gefunden.");
  if (decision === "dismissed" && !note?.trim())
    throw badRequest("Eine abgelehnte Meldung braucht eine Begründung.");

  run(
    `UPDATE reports SET status = ?, handled_at = ?, handled_by = ?, action_note = ? WHERE id = ?`,
    [decision, decision === "in_review" ? null : nowIso(), moderatorId, note ?? null, id],
  );

  /* Eine verworfene Meldung, die ein Inserat vorsorglich gesperrt
     hat, gibt es wieder frei — aber nur, wenn keine weitere offene
     Meldung darauf liegt. */
  if (decision === "dismissed" && row.listing_id) {
    const others = one<{ n: number }>(
      "SELECT COUNT(*) AS n FROM reports WHERE listing_id = ? AND id <> ? AND status IN ('open','in_review')",
      [row.listing_id, id],
    )!.n;
    if (others === 0) {
      run(
        "UPDATE listings SET status = 'active', updated_at = ? WHERE id = ? AND status = 'suspended'",
        [nowIso(), row.listing_id],
      );
    }
  }

  logAction({
    actorId: moderatorId,
    actorKind: "moderator",
    action: `report.${decision}`,
    subjectType: "report",
    subjectId: id,
    meta: { note: note ?? null },
  });

  return { id, status: decision };
}

export function reportStats() {
  const rows = all<{ status: string; n: number }>(
    "SELECT status, COUNT(*) AS n FROM reports GROUP BY status",
  );
  return Object.fromEntries(rows.map((r) => [r.status, r.n]));
}
