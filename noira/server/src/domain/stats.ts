/* ============================================================
   Kennzahlen

   Zwei getrennte Sichten:

   • Was die Inserierenden sehen: Aufrufe und Nummern-Anzeigen des
     eigenen Inserats, tagesweise. Keine Besucherprofile — die
     Tabelle kennt nur Summen je Tag, und das ist Absicht: Was nicht
     erhoben wird, kann auch nicht herausgegeben werden.

   • Was die Startseite zeigt: Anzahl aktiver Inserate, geprüfter
     Profile, Kantone. Öffentlich, keine Anmeldung nötig.
   ============================================================ */

import { all, one } from "../db/index.js";
import { forbidden, notFound, nowIso, today } from "../lib/http.js";

/** Öffentliche Zahlen für Startseite und Fusszeile. */
export function siteStats() {
  const active = one<{ n: number }>(
    "SELECT COUNT(*) AS n FROM listings WHERE status = 'active' AND (expires_at IS NULL OR expires_at > ?)",
    [nowIso()],
  )!.n;
  const verified = one<{ n: number }>(
    "SELECT COUNT(*) AS n FROM listings WHERE status = 'active' AND verified_at IS NOT NULL",
  )!.n;
  const cantons = all<{ canton: string; n: number }>(
    `SELECT canton, COUNT(*) AS n FROM listings
      WHERE status = 'active' GROUP BY canton ORDER BY n DESC`,
  );
  const categories = all<{ category: string; n: number }>(
    `SELECT category, COUNT(*) AS n FROM listings
      WHERE status = 'active' GROUP BY category ORDER BY n DESC`,
  );
  const online = one<{ n: number }>(
    "SELECT COUNT(*) AS n FROM listings WHERE status = 'active' AND online_until > ?",
    [nowIso()],
  )!.n;

  return {
    listings: active,
    verified,
    online,
    cantons: Object.fromEntries(cantons.map((c) => [c.canton, c.n])),
    categories: Object.fromEntries(categories.map((c) => [c.category, c.n])),
  };
}

const DAY = 86_400_000;

/** Tageswerte eines eigenen Inserats, lückenlos aufgefüllt. */
export function listingStats(accountId: string, listingId: string, days = 30) {
  const owner = one<{ account_id: string }>("SELECT account_id FROM listings WHERE id = ?", [
    listingId,
  ]);
  if (!owner) throw notFound("Inserat nicht gefunden.");
  if (owner.account_id !== accountId) throw forbidden("Das ist nicht Ihr Inserat.");

  const span = Math.min(Math.max(days, 1), 365);
  const from = new Date(Date.now() - (span - 1) * DAY).toISOString().slice(0, 10);

  const rows = all<{ day: string; views: number; reveals: number }>(
    "SELECT day, views, reveals FROM listing_daily_stats WHERE listing_id = ? AND day >= ? ORDER BY day",
    [listingId, from],
  );
  const byDay = new Map(rows.map((r) => [r.day, r]));

  /* Tage ohne Aufrufe fehlen in der Tabelle. Für ein Diagramm müssen
     sie als Null erscheinen, sonst rückt eine Lücke die Kurve
     zusammen und behauptet Wachstum, das es nicht gab. */
  const series: { day: string; views: number; reveals: number }[] = [];
  for (let i = 0; i < span; i++) {
    const day = new Date(Date.now() - (span - 1 - i) * DAY).toISOString().slice(0, 10);
    const hit = byDay.get(day);
    series.push({ day, views: hit?.views ?? 0, reveals: hit?.reveals ?? 0 });
  }

  const totals = series.reduce(
    (acc, d) => ({ views: acc.views + d.views, reveals: acc.reveals + d.reveals }),
    { views: 0, reveals: 0 },
  );

  return {
    listingId,
    from,
    to: today(),
    series,
    totals: {
      ...totals,
      /* Anteil der Aufrufe, die zur Nummer führten — in Promille als
         Ganzzahl, damit keine Rundung im Client passiert. */
      revealRatePermille: totals.views ? Math.round((totals.reveals / totals.views) * 1000) : 0,
    },
  };
}

/** Übersicht über alle eigenen Inserate. */
export function accountStats(accountId: string, days = 30) {
  const span = Math.min(Math.max(days, 1), 365);
  const from = new Date(Date.now() - (span - 1) * DAY).toISOString().slice(0, 10);

  return all<{ id: string; name: string; slug: string; views: number; reveals: number }>(
    `SELECT l.id, l.name, l.slug,
            COALESCE(SUM(s.views), 0) AS views,
            COALESCE(SUM(s.reveals), 0) AS reveals
       FROM listings l
       LEFT JOIN listing_daily_stats s ON s.listing_id = l.id AND s.day >= ?
      WHERE l.account_id = ?
      GROUP BY l.id
      ORDER BY views DESC`,
    [from, accountId],
  );
}

/** Für die Moderation: was liegt an, was läuft. */
export function adminStats() {
  const count = (sql: string, params: unknown[] = []) => one<{ n: number }>(sql, params)!.n;
  return {
    pendingReview: count("SELECT COUNT(*) AS n FROM listings WHERE status = 'pending_review'"),
    suspended: count("SELECT COUNT(*) AS n FROM listings WHERE status = 'suspended'"),
    activeListings: count("SELECT COUNT(*) AS n FROM listings WHERE status = 'active'"),
    pendingVerifications: count("SELECT COUNT(*) AS n FROM verifications WHERE status = 'pending'"),
    openReports: count("SELECT COUNT(*) AS n FROM reports WHERE status IN ('open','in_review')"),
    urgentReports: count(
      "SELECT COUNT(*) AS n FROM reports WHERE status IN ('open','in_review') AND kind IN ('coercion','minor')",
    ),
    accounts: count("SELECT COUNT(*) AS n FROM accounts"),
    revenue30d: one<{ s: number | null }>(
      "SELECT SUM(amount_total) AS s FROM orders WHERE status = 'paid' AND paid_at > ?",
      [new Date(Date.now() - 30 * DAY).toISOString()],
    )!.s ?? 0,
  };
}
