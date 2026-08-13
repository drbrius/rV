/* ============================================================
   Protokoll

   Jede Entscheidung, die jemanden trifft — Freigabe, Ablehnung,
   Sperrung, Löschung von Ausweisen — wird hier festgehalten: wer,
   wann, woran, warum. Nur so lässt sich später beantworten, ob
   nach den eigenen Regeln gehandelt wurde.

   Geschrieben wird ausschliesslich; es gibt bewusst keine Funktion
   zum Ändern oder Löschen von Einträgen.
   ============================================================ */

import { all, run } from "../db/index.js";
import { nowIso } from "../lib/http.js";
import { newId } from "../lib/ids.js";

export type ActorKind = "advertiser" | "moderator" | "admin" | "system" | "anonymous";

export function logAction(entry: {
  actorId?: string | null;
  actorKind: ActorKind;
  action: string;
  subjectType?: string;
  subjectId?: string;
  meta?: unknown;
  ipHash?: string;
}) {
  run(
    `INSERT INTO audit_log (id, actor_id, actor_kind, action, subject_type, subject_id, meta, at, ip_hash)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      newId("aud"),
      entry.actorId ?? null,
      entry.actorKind,
      entry.action,
      entry.subjectType ?? null,
      entry.subjectId ?? null,
      entry.meta === undefined ? null : JSON.stringify(entry.meta),
      nowIso(),
      entry.ipHash ?? null,
    ],
  );
}

export function historyOf(subjectType: string, subjectId: string) {
  return all<{
    action: string;
    actor_kind: string;
    actor_id: string | null;
    meta: string | null;
    at: string;
  }>(
    `SELECT action, actor_kind, actor_id, meta, at FROM audit_log
      WHERE subject_type = ? AND subject_id = ? ORDER BY at DESC`,
    [subjectType, subjectId],
  ).map((r) => ({
    action: r.action,
    actorKind: r.actor_kind,
    actorId: r.actor_id,
    meta: r.meta ? (JSON.parse(r.meta) as unknown) : null,
    at: r.at,
  }));
}
