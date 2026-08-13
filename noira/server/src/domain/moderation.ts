/* ============================================================
   Moderation

   Die Prüfung entscheidet über Inhalte, nicht über Geld. Wer bezahlt
   hat und abgelehnt wird, hat Anspruch auf eine Begründung — darum
   ist der Grund bei jeder Ablehnung Pflicht, im Code und nicht bloss
   in der Richtlinie.

   Freigabe und Zahlung sind zwei Bedingungen für dasselbe Ereignis;
   zusammengeführt werden sie in `publishIfReady`.
   ============================================================ */

import { all, one, run, tx } from "../db/index.js";
import { badRequest, conflict, notFound, nowIso } from "../lib/http.js";
import { publishIfReady } from "./ads.js";
import { logAction } from "./audit.js";
import { languagesOf, servicesOf, type ListingRow } from "./listings.js";

export function reviewQueue() {
  return all<ListingRow>(
    `SELECT * FROM listings WHERE status IN ('pending_review','suspended')
      ORDER BY CASE status WHEN 'suspended' THEN 0 ELSE 1 END, updated_at`,
  ).map((row) => ({
    id: row.id,
    slug: row.slug,
    status: row.status,
    name: row.name,
    age: row.age,
    category: row.category,
    canton: row.canton,
    city: row.city,
    tagline: row.tagline,
    about: row.about,
    services: servicesOf(row.id),
    languages: languagesOf(row.id),
    photos: all<{ id: string; storage_key: string }>(
      "SELECT id, storage_key FROM listing_photos WHERE listing_id = ? ORDER BY position",
      [row.id],
    ).map((p) => ({ id: p.id, url: `/api/media/${p.storage_key}` })),
    verified: row.verified_at !== null,
    paid: row.plan !== null && row.expires_at !== null && row.expires_at > nowIso(),
    accountId: row.account_id,
    submittedAt: row.updated_at,
    openReports: one<{ n: number }>(
      "SELECT COUNT(*) AS n FROM reports WHERE listing_id = ? AND status IN ('open','in_review')",
      [row.id],
    )!.n,
  }));
}

export function approveListing(listingId: string, moderatorId: string) {
  const row = one<ListingRow>("SELECT * FROM listings WHERE id = ?", [listingId]);
  if (!row) throw notFound("Inserat nicht gefunden.");
  if (row.status === "draft") throw conflict("Ein Entwurf wurde noch nicht eingereicht.");

  const open = one<{ n: number }>(
    "SELECT COUNT(*) AS n FROM reports WHERE listing_id = ? AND status IN ('open','in_review') AND kind IN ('coercion','minor')",
    [listingId],
  )!.n;
  if (open > 0)
    throw conflict("Zu diesem Inserat liegt eine dringende Meldung vor. Erst die Meldung erledigen.");

  let published = false;
  tx(() => {
    run(
      `UPDATE listings SET moderated_at = ?, moderated_by = ?, rejected_reason = NULL,
              status = CASE WHEN status IN ('rejected','suspended') THEN 'pending_review' ELSE status END,
              updated_at = ?
        WHERE id = ?`,
      [nowIso(), moderatorId, nowIso(), listingId],
    );
    published = publishIfReady(listingId);
    logAction({
      actorId: moderatorId,
      actorKind: "moderator",
      action: "listing.approved",
      subjectType: "listing",
      subjectId: listingId,
      meta: { published },
    });
  });

  return {
    id: listingId,
    reviewed: true,
    published,
    /* Wenn nicht veröffentlicht wurde, fehlt die Zahlung — das ist
       kein Fehler, sondern der zweite offene Punkt. */
    waitingFor: published ? null : ("payment" as const),
  };
}

export function rejectListing(listingId: string, moderatorId: string, reason: string) {
  if (!reason?.trim()) throw badRequest("Eine Ablehnung braucht einen Grund.");
  const row = one<ListingRow>("SELECT * FROM listings WHERE id = ?", [listingId]);
  if (!row) throw notFound("Inserat nicht gefunden.");

  tx(() => {
    run(
      `UPDATE listings SET status = 'rejected', rejected_reason = ?, moderated_at = ?,
              moderated_by = ?, updated_at = ? WHERE id = ?`,
      [reason.trim(), nowIso(), moderatorId, nowIso(), listingId],
    );
    logAction({
      actorId: moderatorId,
      actorKind: "moderator",
      action: "listing.rejected",
      subjectType: "listing",
      subjectId: listingId,
      meta: { reason: reason.trim() },
    });
  });
  return { id: listingId, status: "rejected", reason: reason.trim() };
}

/** Sofort vom Netz — ohne Frist, ohne Rückfrage. */
export function suspendListing(listingId: string, moderatorId: string, reason: string) {
  if (!reason?.trim()) throw badRequest("Eine Sperrung braucht einen Grund.");
  if (!one("SELECT id FROM listings WHERE id = ?", [listingId]))
    throw notFound("Inserat nicht gefunden.");

  run(
    "UPDATE listings SET status = 'suspended', rejected_reason = ?, moderated_at = ?, moderated_by = ?, updated_at = ? WHERE id = ?",
    [reason.trim(), nowIso(), moderatorId, nowIso(), listingId],
  );
  logAction({
    actorId: moderatorId,
    actorKind: "moderator",
    action: "listing.suspended",
    subjectType: "listing",
    subjectId: listingId,
    meta: { reason: reason.trim() },
  });
  return { id: listingId, status: "suspended" };
}

/** Konto sperren: alle Sitzungen enden, alle Inserate verschwinden. */
export function disableAccount(accountId: string, adminId: string, reason: string) {
  if (!reason?.trim()) throw badRequest("Eine Kontosperre braucht einen Grund.");
  if (!one("SELECT id FROM accounts WHERE id = ?", [accountId]))
    throw notFound("Konto nicht gefunden.");

  tx(() => {
    run("UPDATE accounts SET disabled_at = ?, disabled_reason = ?, updated_at = ? WHERE id = ?", [
      nowIso(),
      reason.trim(),
      nowIso(),
      accountId,
    ]);
    run("DELETE FROM sessions WHERE account_id = ?", [accountId]);
    run(
      "UPDATE listings SET status = 'suspended', updated_at = ? WHERE account_id = ? AND status IN ('active','pending_review','paused')",
      [nowIso(), accountId],
    );
    logAction({
      actorId: adminId,
      actorKind: "admin",
      action: "account.disabled",
      subjectType: "account",
      subjectId: accountId,
      meta: { reason: reason.trim() },
    });
  });
  return { id: accountId, disabled: true };
}

export function enableAccount(accountId: string, adminId: string) {
  run("UPDATE accounts SET disabled_at = NULL, disabled_reason = NULL, updated_at = ? WHERE id = ?", [
    nowIso(),
    accountId,
  ]);
  logAction({
    actorId: adminId,
    actorKind: "admin",
    action: "account.enabled",
    subjectType: "account",
    subjectId: accountId,
  });
  return { id: accountId, disabled: false };
}

/** Einzelnes Bild ablehnen, ohne das ganze Inserat zu sperren. */
export function setPhotoApproval(photoId: string, moderatorId: string, approved: boolean) {
  const photo = one<{ id: string; listing_id: string }>(
    "SELECT id, listing_id FROM listing_photos WHERE id = ?",
    [photoId],
  );
  if (!photo) throw notFound("Bild nicht gefunden.");
  run("UPDATE listing_photos SET approved = ? WHERE id = ?", [approved ? 1 : 0, photoId]);
  logAction({
    actorId: moderatorId,
    actorKind: "moderator",
    action: approved ? "photo.approved" : "photo.rejected",
    subjectType: "listing",
    subjectId: photo.listing_id,
    meta: { photoId },
  });
  return { id: photoId, approved };
}
