/* ============================================================
   Verifizierung

   Was die Plattform öffentlich verspricht, steht hier als Code:

   • Ausweis und Selfie werden verschlüsselt abgelegt, getrennt vom
     Inserat — in `secure/`, nie über eine URL erreichbar.
   • Das Codewort des Tages muss auf dem Selfie sichtbar sein. Damit
     ist belegt, dass die Aufnahme von heute ist.
   • 90 Tage nach Ablauf des letzten Inserats werden die Dokumente
     gelöscht. Die Frist steht in der Zeile; `purgeExpired()` führt
     sie aus. Ein Versprechen ohne Job, der es einlöst, ist keins.
   ============================================================ */

import { all, one, run } from "../db/index.js";
import { badRequest, conflict, notFound, nowIso, plusDays } from "../lib/http.js";
import { newId } from "../lib/ids.js";
import { putSecure, removeSecure } from "../lib/storage.js";
import { codewordOfDay } from "./catalog.js";

const RETENTION_DAYS = 90;

export type Verification = {
  id: string;
  account_id: string;
  listing_id: string | null;
  status: "pending" | "approved" | "rejected";
  codeword: string;
  doc_key: string | null;
  selfie_key: string | null;
  submitted_at: string;
  reviewed_at: string | null;
  reviewer_id: string | null;
  reject_reason: string | null;
  purge_after: string;
};

export function submit(
  accountId: string,
  listingId: string | null,
  files: { doc: { data: Buffer; mime: string }; selfie: { data: Buffer; mime: string } },
) {
  const open = one<Verification>(
    "SELECT * FROM verifications WHERE account_id = ? AND status = 'pending'",
    [accountId],
  );
  if (open) throw conflict("Es läuft bereits eine Prüfung für dieses Konto.");

  for (const [name, file] of Object.entries(files)) {
    if (!file.mime.startsWith("image/")) throw badRequest(`${name}: nur Bilddateien.`);
    if (file.data.length > 12 * 1024 * 1024) throw badRequest(`${name}: höchstens 12 MB.`);
  }

  const id = newId("ver");
  const docKey = putSecure(`${id}-doc`, files.doc.data);
  const selfieKey = putSecure(`${id}-selfie`, files.selfie.data);

  run(
    `INSERT INTO verifications
       (id, account_id, listing_id, status, codeword, doc_key, selfie_key,
        submitted_at, purge_after)
     VALUES (?, ?, ?, 'pending', ?, ?, ?, ?, ?)`,
    [
      id,
      accountId,
      listingId,
      codewordOfDay(),
      docKey,
      selfieKey,
      nowIso(),
      plusDays(RETENTION_DAYS),
    ],
  );
  return publicView(one<Verification>("SELECT * FROM verifications WHERE id = ?", [id])!);
}

export function latestFor(accountId: string) {
  const row = one<Verification>(
    "SELECT * FROM verifications WHERE account_id = ? ORDER BY submitted_at DESC LIMIT 1",
    [accountId],
  );
  return row ? publicView(row) : null;
}

export function pendingQueue() {
  return all<Verification>(
    "SELECT * FROM verifications WHERE status = 'pending' ORDER BY submitted_at",
  ).map((v) => ({
    id: v.id,
    accountId: v.account_id,
    listingId: v.listing_id,
    codeword: v.codeword,
    submittedAt: v.submitted_at,
  }));
}

export function decide(
  id: string,
  reviewerId: string,
  approved: boolean,
  reason?: string,
) {
  const row = one<Verification>("SELECT * FROM verifications WHERE id = ?", [id]);
  if (!row) throw notFound("Prüfvorgang nicht gefunden.");
  if (row.status !== "pending") throw conflict("Dieser Vorgang ist bereits entschieden.");
  if (!approved && !reason?.trim()) throw badRequest("Eine Ablehnung braucht einen Grund.");

  run(
    `UPDATE verifications SET status = ?, reviewed_at = ?, reviewer_id = ?, reject_reason = ?
      WHERE id = ?`,
    [approved ? "approved" : "rejected", nowIso(), reviewerId, reason ?? null, id],
  );

  if (approved) {
    /* Das Zeichen hängt am Konto, nicht am einzelnen Inserat: Wer
       einmal geprüft ist, muss das für ein zweites Inserat nicht
       wiederholen. */
    run("UPDATE listings SET verified_at = ?, updated_at = ? WHERE account_id = ?", [
      nowIso(),
      nowIso(),
      row.account_id,
    ]);
  }
  return { id, status: approved ? "approved" : "rejected" };
}

/**
 * Löscht abgelaufene Unterlagen — Dateien zuerst, dann die Schlüssel
 * in der Zeile. Der Prüfvorgang selbst bleibt als Nachweis stehen,
 * dass geprüft wurde; die Ausweise verschwinden.
 */
export function purgeExpired(now = nowIso()) {
  const due = all<Verification>(
    "SELECT * FROM verifications WHERE purge_after <= ? AND (doc_key IS NOT NULL OR selfie_key IS NOT NULL)",
    [now],
  );
  for (const v of due) {
    if (v.doc_key) removeSecure(v.doc_key);
    if (v.selfie_key) removeSecure(v.selfie_key);
    run("UPDATE verifications SET doc_key = NULL, selfie_key = NULL WHERE id = ?", [v.id]);
  }
  return due.length;
}

/** Die Frist läuft ab dem Ablauf des letzten Inserats, nicht ab dem Upload. */
export function extendRetention(accountId: string, listingExpiry: string) {
  const purgeAfter = plusDays(RETENTION_DAYS, new Date(listingExpiry));
  run(
    "UPDATE verifications SET purge_after = ? WHERE account_id = ? AND purge_after < ?",
    [purgeAfter, accountId, purgeAfter],
  );
}

function publicView(v: Verification) {
  return {
    id: v.id,
    status: v.status,
    codeword: v.codeword,
    submittedAt: v.submitted_at,
    reviewedAt: v.reviewed_at,
    rejectReason: v.reject_reason,
    /* Die Frist gehört zur Auskunft: Wer Unterlagen abgibt, soll
       sehen, wann sie verschwinden. */
    documentsDeletedAfter: v.purge_after,
    documentsPresent: v.doc_key !== null,
  };
}
