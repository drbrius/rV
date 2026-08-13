/* ============================================================
   Inserate: Abfrage und Darstellung

   Die Filter spiegeln genau das, was die Oberfläche in der URL
   führt — dieselben Namen, dieselbe Bedeutung. Ein Filter, der im
   Browser anders wirkt als im Server, ist eine Fehlerquelle, die
   niemand findet.

   Zwei Entscheidungen, die im SQL sichtbar sind:

   • Services werden mit UND verknüpft (wer drei ankreuzt, will alle
     drei), Sprachen mit ODER (wer Deutsch oder Französisch spricht,
     passt). Das entspricht der Erwartung, nicht der Symmetrie.

   • „Empfohlen" ist offengelegte Sortierung: bezahlte Platzierung,
     dann Verifizierung, dann Aktualität. Keine geheime Gewichtung.
   ============================================================ */

import { all, one, run } from "../db/index.js";
import { nowIso, today } from "../lib/http.js";

export type ListingRow = {
  id: string;
  slug: string;
  name: string;
  age: number | null;
  category: string;
  canton: string;
  city: string;
  tagline: string;
  about: string;
  incall: number;
  outcall: number;
  rate_m30: number | null;
  rate_h1: number | null;
  rate_h2: number | null;
  rate_night: number | null;
  availability: string;
  phone: string;
  phone_hidden: number;
  has_video: number;
  online_until: string | null;
  plan: string | null;
  status: string;
  published_at: string | null;
  expires_at: string | null;
  verified_at: string | null;
  rejected_reason: string | null;
  moderated_by: string | null;
  moderated_at: string | null;
  account_id: string;
  created_at: string;
  updated_at: string;
};

export type ListingFilters = {
  q?: string;
  kanton?: string;
  kategorie?: string;
  services?: string[];
  sprachen?: string[];
  verifiziert?: boolean;
  video?: boolean;
  online?: boolean;
  empfang?: boolean;
  besuch?: boolean;
  /** Höchstpreis pro Stunde in Rappen. */
  preis?: number;
  sortierung?: "relevanz" | "neu" | "preis-auf" | "preis-ab" | "premium";
  page?: number;
  limit?: number;
};

const SORTS: Record<string, string> = {
  // Bezahlt zuerst, dann geprüft, dann frisch — genau die Reihenfolge,
  // die auch öffentlich dokumentiert ist.
  relevanz: `CASE l.plan WHEN 'premium' THEN 0 WHEN 'plus' THEN 1 ELSE 2 END,
             CASE WHEN l.verified_at IS NULL THEN 1 ELSE 0 END,
             l.published_at DESC`,
  neu: "l.published_at DESC",
  "preis-auf": "COALESCE(l.rate_h1, 999999999) ASC, l.published_at DESC",
  "preis-ab": "COALESCE(l.rate_h1, 0) DESC, l.published_at DESC",
  premium: "l.published_at DESC",
};

function buildWhere(f: ListingFilters) {
  const where: string[] = ["l.status = 'active'", "(l.expires_at IS NULL OR l.expires_at > ?)"];
  const params: unknown[] = [nowIso()];

  if (f.kanton) {
    where.push("l.canton = ?");
    params.push(f.kanton);
  }
  if (f.kategorie) {
    where.push("l.category = ?");
    params.push(f.kategorie);
  }
  if (f.verifiziert) where.push("l.verified_at IS NOT NULL");
  if (f.video) where.push("l.has_video = 1");
  if (f.online) {
    where.push("l.online_until IS NOT NULL AND l.online_until > ?");
    params.push(nowIso());
  }
  if (f.empfang) where.push("l.incall = 1");
  if (f.besuch) where.push("l.outcall = 1");
  if (f.sortierung === "premium") where.push("l.plan = 'premium'");

  if (typeof f.preis === "number") {
    where.push("l.rate_h1 IS NOT NULL AND l.rate_h1 <= ?");
    params.push(f.preis);
  }

  // Services: alle gewählten müssen vorhanden sein.
  if (f.services?.length) {
    where.push(
      `(SELECT COUNT(*) FROM listing_services s
          WHERE s.listing_id = l.id AND s.service IN (${f.services.map(() => "?").join(",")})
       ) = ?`,
    );
    params.push(...f.services, f.services.length);
  }

  // Sprachen: mindestens eine genügt.
  if (f.sprachen?.length) {
    where.push(
      `EXISTS (SELECT 1 FROM listing_languages g
                WHERE g.listing_id = l.id
                  AND g.language IN (${f.sprachen.map(() => "?").join(",")}))`,
    );
    params.push(...f.sprachen);
  }

  if (f.q?.trim()) {
    // Jedes Wort muss irgendwo vorkommen — schlichte UND-Suche.
    // Für echte Volltextsuche steht FTS5 bereit; bei dieser
    // Datenmenge wäre das verfrüht.
    for (const term of f.q.trim().toLowerCase().split(/\s+/).slice(0, 6)) {
      where.push(
        `(LOWER(l.name) LIKE ? OR LOWER(l.city) LIKE ? OR LOWER(l.tagline) LIKE ?
          OR LOWER(l.about) LIKE ?)`,
      );
      const like = `%${term}%`;
      params.push(like, like, like, like);
    }
  }

  return { where: where.join(" AND "), params };
}

export function searchListings(f: ListingFilters) {
  const limit = Math.min(Math.max(f.limit ?? 24, 1), 60);
  const page = Math.max(f.page ?? 1, 1);
  const offset = (page - 1) * limit;
  const { where, params } = buildWhere(f);
  const order = SORTS[f.sortierung ?? "relevanz"] ?? SORTS.relevanz;

  const total = (
    one<{ n: number }>(`SELECT COUNT(*) AS n FROM listings l WHERE ${where}`, params) ?? { n: 0 }
  ).n;

  const rows = all<ListingRow>(
    `SELECT l.* FROM listings l WHERE ${where} ORDER BY ${order} LIMIT ? OFFSET ?`,
    [...params, limit, offset],
  );

  return {
    total,
    page,
    limit,
    pages: Math.ceil(total / limit) || 1,
    items: rows.map((row) => toPublic(row)),
  };
}

export function findBySlug(slug: string) {
  const row = one<ListingRow>(
    `SELECT * FROM listings WHERE slug = ? AND status = 'active'
       AND (expires_at IS NULL OR expires_at > ?)`,
    [slug, nowIso()],
  );
  return row ? toPublic(row, { withDetail: true }) : null;
}

export function servicesOf(listingId: string): string[] {
  return all<{ service: string }>(
    "SELECT service FROM listing_services WHERE listing_id = ? ORDER BY service",
    [listingId],
  ).map((r) => r.service);
}

export function languagesOf(listingId: string): string[] {
  return all<{ language: string }>(
    "SELECT language FROM listing_languages WHERE listing_id = ? ORDER BY language",
    [listingId],
  ).map((r) => r.language);
}

export function photosOf(listingId: string) {
  return all<{ id: string; storage_key: string; position: number }>(
    `SELECT id, storage_key, position FROM listing_photos
      WHERE listing_id = ? AND approved = 1 ORDER BY position, created_at`,
    [listingId],
  ).map((p) => ({ id: p.id, url: `/api/media/${p.storage_key}`, position: p.position }));
}

/**
 * Aus der Datenbankzeile wird die öffentliche Form.
 *
 * Hier fällt weg, was niemanden ausserhalb angeht: die Kontonummer,
 * der Status, die Prüfvermerke. Und die Telefonnummer erscheint nur,
 * wenn sie nicht verborgen ist — sie wird ohnehin erst über einen
 * eigenen Aufruf herausgegeben.
 */
export function toPublic(row: ListingRow, opts: { withDetail?: boolean } = {}) {
  const base = {
    id: row.id,
    slug: row.slug,
    name: row.name,
    age: row.age ?? 0,
    category: row.category,
    canton: row.canton,
    city: row.city,
    tagline: row.tagline,
    incall: row.incall === 1,
    outcall: row.outcall === 1,
    verified: row.verified_at !== null,
    premium: row.plan === "premium",
    hasVideo: row.has_video === 1,
    online: row.online_until !== null && row.online_until > nowIso(),
    published: (row.published_at ?? row.created_at).slice(0, 10),
    rates: {
      m30: row.rate_m30,
      h1: row.rate_h1,
      h2: row.rate_h2,
      night: row.rate_night,
    },
    photos: photosOf(row.id),
  };

  if (!opts.withDetail) return base;

  return {
    ...base,
    about: row.about,
    availability: row.availability,
    services: servicesOf(row.id),
    languages: languagesOf(row.id),
    phoneHidden: row.phone_hidden === 1,
  };
}

/** Aufruf zählen — tagesweise verdichtet statt eine Zeile je Besuch. */
export function countView(listingId: string, kind: "view" | "reveal") {
  const column = kind === "view" ? "views" : "reveals";
  run(
    `INSERT INTO listing_daily_stats (listing_id, day, views, reveals)
     VALUES (?, ?, ?, ?)
     ON CONFLICT (listing_id, day) DO UPDATE SET ${column} = ${column} + 1`,
    [listingId, today(), kind === "view" ? 1 : 0, kind === "reveal" ? 1 : 0],
  );
}

/** Läuft im Hintergrund: abgelaufene Inserate aus der Suche nehmen. */
export function expireListings(): number {
  return run(
    `UPDATE listings SET status = 'expired', updated_at = ?
      WHERE status = 'active' AND expires_at IS NOT NULL AND expires_at <= ?`,
    [nowIso(), nowIso()],
  );
}
