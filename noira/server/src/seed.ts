/* ============================================================
   Demo-Datenbestand

   Füllt eine leere Datenbank mit dem Datensatz, der bisher im
   Browser lag (`client/src/data/listings.ts`). Damit zeigt die
   Oberfläche gegen den echten Server dasselbe wie vorher gegen die
   eingebauten Daten — und der Unterschied zwischen „sieht gut aus"
   und „funktioniert" wird sichtbar.

   Zwei Dinge, die hier passieren und im Frontend nicht nötig waren:

   • Tarife werden von Franken in Rappen umgerechnet. Im Browser
     stand 450; in der Datenbank steht 45000. Ganzzahlig, exakt.
   • Zu jedem Inserat entstehen echte Bilddateien. Ohne sie wäre
     `/api/media` im Demo-Betrieb ein toter Pfad.

   Aufruf:  pnpm seed        (bricht ab, wenn schon Daten da sind)
            pnpm seed --force (löscht vorher)
   ============================================================ */

import path from "node:path";
import { pathToFileURL } from "node:url";
import { all, closeDatabase, one, openDatabase, run, tx } from "./db/index.js";
import { env } from "./env.js";
import { nowIso, plusDays } from "./lib/http.js";
import { newId } from "./lib/ids.js";
import { placeholderPhoto } from "./lib/placeholder.js";
import { putPublic } from "./lib/storage.js";
import { hashPassword } from "./lib/password.js";
import { isLanguage, isService, type PlanId } from "./domain/catalog.js";

type DemoListing = {
  id: string;
  slug: string;
  name: string;
  age: number;
  category: string;
  canton: string;
  city: string;
  tagline: string;
  about: string;
  services: string[];
  languages: string[];
  rates: { m30?: number | null; h1: number; h2: number; night?: number | null };
  incall: boolean;
  outcall: boolean;
  verified: boolean;
  premium: boolean;
  hasVideo: boolean;
  online: boolean;
  photos: number;
  views: number;
  published: string;
  availability: string;
  phone: string;
  motif: number;
};

/* Der Demo-Datensatz wohnt im Frontend und bleibt dort die eine
   Quelle. Geladen wird er zur Laufzeit statt über einen statischen
   Import: So bleibt die Übersetzungseinheit des Servers frei von
   Client-Code, und der Server hat keine Abhängigkeit auf ein
   Verzeichnis, das es im Betrieb gar nicht gibt. */
async function loadDemoListings(): Promise<DemoListing[]> {
  const file = path.resolve(import.meta.dirname, "../../client/src/data/listings.ts");
  const mod = (await import(pathToFileURL(file).href)) as { LISTINGS: DemoListing[] };
  return mod.LISTINGS;
}

const chf = (v: number | null | undefined) => (v == null ? null : Math.round(v * 100));

function planOf(l: DemoListing): PlanId {
  if (l.premium) return "premium";
  return l.verified || l.hasVideo ? "plus" : "basis";
}

async function seed({ force = false } = {}) {
  openDatabase();

  const existing = one<{ n: number }>("SELECT COUNT(*) AS n FROM listings")!.n;
  if (existing > 0 && !force) {
    console.log(
      `Es liegen bereits ${existing} Inserate in ${env.databasePath}. Mit --force wird neu aufgebaut.`,
    );
    return;
  }
  if (force) {
    // Reihenfolge egal: Fremdschlüssel räumen die Kindtabellen mit ab.
    for (const table of ["listings", "verifications", "orders", "reports", "accounts"]) {
      run(`DELETE FROM ${table}`);
    }
  }

  const listings = await loadDemoListings();
  const at = nowIso();

  /* Drei Konten mit den drei Rollen. Die Passwörter stehen hier im
     Klartext, weil sie ausschliesslich für den Demo-Betrieb sind —
     `pnpm seed` gegen eine Produktionsdatenbank ist ein Fehler, kein
     Anwendungsfall. */
  const people = [
    { key: "demo", email: "demo@noira.ch", role: "advertiser", password: "demo-inserat-2026" },
    { key: "mod", email: "moderation@noira.ch", role: "moderator", password: "demo-pruefung-2026" },
    { key: "admin", email: "admin@noira.ch", role: "admin", password: "demo-verwaltung-2026" },
  ] as const;

  const accountIds: Record<string, string> = {};
  tx(() => {
    for (const p of people) {
      const id = newId("acc");
      accountIds[p.key] = id;
      run(
        `INSERT INTO accounts (id, email, password_hash, role, created_at, updated_at)
         VALUES (?, ?, ?, ?, ?, ?)`,
        [id, p.email, hashPassword(p.password), p.role, at, at],
      );
    }
  });

  let photoCount = 0;

  for (const [index, l] of listings.entries()) {
    const listingId = newId("lst");
    const plan = planOf(l);
    const published = new Date(`${l.published}T12:00:00Z`).toISOString();

    tx(() => {
      run(
        `INSERT INTO listings
           (id, account_id, slug, status, name, age, category, canton, city, tagline, about,
            incall, outcall, rate_m30, rate_h1, rate_h2, rate_night, availability, phone,
            phone_hidden, has_video, online_until, plan, published_at, expires_at, verified_at,
            moderated_at, moderated_by, created_at, updated_at)
         VALUES (?, ?, ?, 'active', ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 0, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          listingId,
          accountIds.demo,
          l.slug,
          l.name,
          l.age,
          l.category,
          l.canton,
          l.city,
          l.tagline,
          l.about,
          l.incall ? 1 : 0,
          l.outcall ? 1 : 0,
          chf(l.rates.m30),
          chf(l.rates.h1),
          chf(l.rates.h2),
          chf(l.rates.night),
          l.availability,
          l.phone,
          l.hasVideo ? 1 : 0,
          // „Jetzt erreichbar" als Frist, nicht als Schalter.
          l.online ? new Date(Date.now() + 3 * 3600_000).toISOString() : null,
          plan,
          published,
          plusDays(plan === "premium" ? 90 : 30),
          l.verified ? published : null,
          published,
          accountIds.mod,
          published,
          at,
        ],
      );

      for (const s of l.services.filter(isService))
        run("INSERT INTO listing_services (listing_id, service) VALUES (?, ?)", [listingId, s]);
      for (const g of l.languages.filter(isLanguage))
        run("INSERT INTO listing_languages (listing_id, language) VALUES (?, ?)", [listingId, g]);

      // Drei Bilder je Inserat statt der behaupteten Zahl: genug für
      // Galerie und Karte, ohne die Demo-Datenbank aufzublähen.
      for (let n = 0; n < 3; n++) {
        const photoId = newId("pho");
        const key = `${photoId}.png`;
        putPublic(key, placeholderPhoto(l.motif, index * 10 + n));
        run(
          `INSERT INTO listing_photos (id, listing_id, storage_key, mime, bytes, position, approved, created_at)
           VALUES (?, ?, ?, 'image/png', 0, ?, 1, ?)`,
          [photoId, listingId, key, n, published],
        );
        photoCount++;
      }

      /* Aufrufe der letzten 30 Tage aus der Demo-Gesamtzahl
         rückverteilt, mit Wochenrhythmus — sonst sieht die
         Statistikkurve aus wie ein Lineal. */
      const perDay = Math.max(1, Math.round(l.views / 400));
      for (let d = 0; d < 30; d++) {
        const day = new Date(Date.now() - d * 86_400_000).toISOString().slice(0, 10);
        const weekday = new Date(day).getUTCDay();
        const factor = weekday === 5 || weekday === 6 ? 1.6 : weekday === 0 ? 0.7 : 1;
        const views = Math.round(perDay * factor * (0.7 + ((index + d) % 7) / 10));
        run(
          `INSERT INTO listing_daily_stats (listing_id, day, views, reveals) VALUES (?, ?, ?, ?)`,
          [listingId, day, views, Math.round(views * 0.11)],
        );
      }
    });
  }

  const total = one<{ n: number }>("SELECT COUNT(*) AS n FROM listings")!.n;
  const cantons = all<{ canton: string }>("SELECT DISTINCT canton FROM listings").length;

  console.log(`\nNOIRA — Demo-Datenbestand angelegt in ${env.databasePath}`);
  console.log(`  Inserate ........ ${total} in ${cantons} Kantonen`);
  console.log(`  Bilder .......... ${photoCount} (erzeugt, ${env.storageDir}/public)`);
  console.log(`  Konten:`);
  for (const p of people) console.log(`    ${p.role.padEnd(10)} ${p.email}  ${p.password}`);
  console.log();
}

const force = process.argv.includes("--force");
await seed({ force });
closeDatabase();
