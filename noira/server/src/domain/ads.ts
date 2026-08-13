/* ============================================================
   Inserate: die schreibende Seite

   Regeln, die hier und nur hier gelten — die Oberfläche darf sie
   spiegeln, verlassen kann man sich nur auf diese:

   • Unter 18 gibt es kein Inserat. Das ist keine Eingabehilfe,
     sondern die Grenze, an der die Plattform steht oder fällt.
   • Ein Inserat geht nie direkt live. Es wird eingereicht, geprüft
     und erst nach bezahlter Laufzeit freigeschaltet.
   • Wer bezahlt hat, bekommt Reichweite — nicht das Recht, die
     Prüfung zu überspringen.
   ============================================================ */

import { all, one, run, tx } from "../db/index.js";
import { badRequest, conflict, forbidden, notFound, nowIso, plusDays } from "../lib/http.js";
import { newId, slugify } from "../lib/ids.js";
import {
  isCanton,
  isCategory,
  isLanguage,
  isService,
  PLANS,
  type PlanId,
  type Duration,
} from "./catalog.js";
import type { ListingRow } from "./listings.js";
import { languagesOf, photosOf, servicesOf } from "./listings.js";

export const MIN_AGE = 18;
const TAGLINE_MAX = 80;
const ABOUT_MIN = 80;
const ABOUT_MAX = 1200;

export type AdInput = {
  name: string;
  age: number;
  category: string;
  canton: string;
  city: string;
  tagline: string;
  about: string;
  services: string[];
  languages: string[];
  incall: boolean;
  outcall: boolean;
  rates: { m30?: number | null; h1: number; h2?: number | null; night?: number | null };
  availability: string;
  phone: string;
  phoneHidden?: boolean;
};

/**
 * Prüft eine Eingabe vollständig und sammelt alle Fehler, statt beim
 * ersten abzubrechen. Wer ein Formular abschickt, will nicht nach
 * jedem Absenden einen neuen Fehler entdecken.
 */
export function validateAd(input: Partial<AdInput>, { draft = false } = {}) {
  const errors: Record<string, string> = {};
  const need = (cond: boolean, field: string, msg: string) => {
    if (!cond) errors[field] = msg;
  };

  if (!draft || input.name !== undefined)
    need((input.name ?? "").trim().length >= 2, "name", "Bitte einen Namen angeben.");

  if (!draft || input.age !== undefined) {
    const age = Number(input.age);
    need(
      Number.isInteger(age) && age >= MIN_AGE && age <= 99,
      "age",
      `Nur volljährige Personen dürfen inserieren (ab ${MIN_AGE}).`,
    );
  }

  if (!draft || input.category !== undefined)
    need(isCategory(input.category), "category", "Unbekannte Kategorie.");
  if (!draft || input.canton !== undefined)
    need(isCanton(input.canton), "canton", "Unbekannter Kanton.");
  if (!draft || input.city !== undefined)
    need((input.city ?? "").trim().length >= 2, "city", "Bitte den Ort angeben.");

  if (!draft) {
    const tagline = (input.tagline ?? "").trim();
    need(
      tagline.length >= 10 && tagline.length <= TAGLINE_MAX,
      "tagline",
      `Einzeiler zwischen 10 und ${TAGLINE_MAX} Zeichen.`,
    );

    const about = (input.about ?? "").trim();
    need(
      about.length >= ABOUT_MIN && about.length <= ABOUT_MAX,
      "about",
      `Beschreibung zwischen ${ABOUT_MIN} und ${ABOUT_MAX} Zeichen.`,
    );

    need((input.services ?? []).length > 0, "services", "Mindestens ein Angebot.");
    need((input.languages ?? []).length > 0, "languages", "Mindestens eine Sprache.");
    need(
      Boolean(input.incall) || Boolean(input.outcall),
      "place",
      "Empfang, Besuche oder beides — eines davon.",
    );
    need(
      (input.availability ?? "").trim().length >= 3,
      "availability",
      "Wann sind Sie erreichbar?",
    );
    need(
      /^(\+41|0)[\s\d]{9,}$/.test((input.phone ?? "").trim()),
      "phone",
      "Schweizer Nummer, z. B. 079 123 45 67.",
    );

    const h1 = Number(input.rates?.h1);
    need(
      Number.isFinite(h1) && h1 >= 2_000 && h1 <= 500_000,
      "rates.h1",
      "Stundentarif zwischen CHF 20 und CHF 5000.",
    );
  }

  for (const s of input.services ?? [])
    if (!isService(s)) errors.services = `Unbekannter Service: ${s}`;
  for (const l of input.languages ?? [])
    if (!isLanguage(l)) errors.languages = `Unbekannte Sprache: ${l}`;

  return errors;
}

function uniqueSlug(name: string, city: string): string {
  const base = slugify(`${name}-${city}`) || "inserat";
  let slug = base;
  let n = 2;
  while (one("SELECT id FROM listings WHERE slug = ?", [slug])) slug = `${base}-${n++}`;
  return slug;
}

export function createDraft(accountId: string, input: Partial<AdInput>) {
  const errors = validateAd(input, { draft: true });
  if (Object.keys(errors).length) throw badRequest("Eingaben unvollständig.", errors);

  const id = newId("lst");
  const at = nowIso();
  tx(() => {
    run(
      `INSERT INTO listings
        (id, account_id, slug, status, name, age, category, canton, city, tagline, about,
         incall, outcall, rate_m30, rate_h1, rate_h2, rate_night, availability, phone,
         phone_hidden, created_at, updated_at)
       VALUES (?, ?, ?, 'draft', ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        id,
        accountId,
        uniqueSlug(input.name ?? "inserat", input.city ?? ""),
        (input.name ?? "").trim(),
        input.age ?? null,
        input.category ?? "begleitung",
        input.canton ?? "ZH",
        (input.city ?? "").trim(),
        (input.tagline ?? "").trim(),
        (input.about ?? "").trim(),
        input.incall === false ? 0 : 1,
        input.outcall ? 1 : 0,
        input.rates?.m30 ?? null,
        input.rates?.h1 ?? null,
        input.rates?.h2 ?? null,
        input.rates?.night ?? null,
        (input.availability ?? "").trim(),
        (input.phone ?? "").trim(),
        input.phoneHidden ? 1 : 0,
        at,
        at,
      ],
    );
    replaceTags(id, input.services ?? [], input.languages ?? []);
  });
  return getOwn(accountId, id);
}

function replaceTags(listingId: string, services: string[], languages: string[]) {
  run("DELETE FROM listing_services WHERE listing_id = ?", [listingId]);
  run("DELETE FROM listing_languages WHERE listing_id = ?", [listingId]);
  for (const s of new Set(services.filter(isService)))
    run("INSERT INTO listing_services (listing_id, service) VALUES (?, ?)", [listingId, s]);
  for (const l of new Set(languages.filter(isLanguage)))
    run("INSERT INTO listing_languages (listing_id, language) VALUES (?, ?)", [listingId, l]);
}

export function updateDraft(accountId: string, id: string, input: Partial<AdInput>) {
  const row = ownRow(accountId, id);

  /* Ein aktives Inserat darf bearbeitet werden — aber inhaltliche
     Änderungen gehen zurück in die Prüfung. Sonst liesse sich ein
     freigegebenes Inserat nachträglich in etwas anderes verwandeln. */
  const contentChanged =
    input.name !== undefined ||
    input.about !== undefined ||
    input.tagline !== undefined ||
    input.category !== undefined;
  const nextStatus =
    row.status === "active" && contentChanged ? "pending_review" : row.status;

  const errors = validateAd(input, { draft: true });
  if (Object.keys(errors).length) throw badRequest("Eingaben unvollständig.", errors);

  const set: string[] = [];
  const params: unknown[] = [];
  const put = (col: string, value: unknown) => {
    set.push(`${col} = ?`);
    params.push(value);
  };

  if (input.name !== undefined) put("name", input.name.trim());
  if (input.age !== undefined) put("age", input.age);
  if (input.category !== undefined) put("category", input.category);
  if (input.canton !== undefined) put("canton", input.canton);
  if (input.city !== undefined) put("city", input.city.trim());
  if (input.tagline !== undefined) put("tagline", input.tagline.trim());
  if (input.about !== undefined) put("about", input.about.trim());
  if (input.incall !== undefined) put("incall", input.incall ? 1 : 0);
  if (input.outcall !== undefined) put("outcall", input.outcall ? 1 : 0);
  if (input.availability !== undefined) put("availability", input.availability.trim());
  if (input.phone !== undefined) put("phone", input.phone.trim());
  if (input.phoneHidden !== undefined) put("phone_hidden", input.phoneHidden ? 1 : 0);
  if (input.rates) {
    put("rate_m30", input.rates.m30 ?? null);
    if (input.rates.h1 !== undefined) put("rate_h1", input.rates.h1);
    put("rate_h2", input.rates.h2 ?? null);
    put("rate_night", input.rates.night ?? null);
  }
  put("status", nextStatus);
  put("updated_at", nowIso());

  tx(() => {
    if (set.length) run(`UPDATE listings SET ${set.join(", ")} WHERE id = ?`, [...params, id]);
    if (input.services || input.languages) {
      replaceTags(id, input.services ?? servicesOf(id), input.languages ?? languagesOf(id));
    }
  });
  return getOwn(accountId, id);
}

/** Zur Prüfung einreichen. Ab hier entscheidet die Moderation. */
export function submitForReview(accountId: string, id: string) {
  const row = ownRow(accountId, id);
  if (row.status === "active") throw conflict("Dieses Inserat ist bereits freigeschaltet.");

  const input: Partial<AdInput> = {
    name: row.name,
    age: row.age ?? 0,
    category: row.category,
    canton: row.canton,
    city: row.city,
    tagline: row.tagline,
    about: row.about,
    services: servicesOf(id),
    languages: languagesOf(id),
    incall: row.incall === 1,
    outcall: row.outcall === 1,
    availability: row.availability,
    phone: row.phone,
    rates: { h1: row.rate_h1 ?? 0 },
  };
  const errors = validateAd(input);
  if (Object.keys(errors).length) throw badRequest("Das Inserat ist noch nicht vollständig.", errors);

  if (photosOf(id).length === 0 && countPhotos(id) === 0)
    throw badRequest("Mindestens ein Foto ist nötig.", { photos: "Mindestens ein Foto." });

  run("UPDATE listings SET status = 'pending_review', updated_at = ? WHERE id = ?", [nowIso(), id]);
  return getOwn(accountId, id);
}

function countPhotos(listingId: string) {
  return one<{ n: number }>("SELECT COUNT(*) AS n FROM listing_photos WHERE listing_id = ?", [
    listingId,
  ])!.n;
}

/**
 * Laufzeit gutschreiben. Wird von der Zahlung ausgelöst, nicht von
 * der Kundschaft.
 *
 * Bezahlt heisst nicht veröffentlicht. Die Laufzeit wird
 * gutgeschrieben; sichtbar wird das Inserat erst, wenn auch die
 * Prüfung durch ist — beide Bedingungen zusammen, in beliebiger
 * Reihenfolge eintreffend. Wer zuerst zahlt und dann geprüft wird,
 * geht bei der Freigabe live; wer zuerst geprüft wird, geht mit der
 * Zahlung live.
 */
export function activate(listingId: string, plan: PlanId, days: Duration) {
  const row = one<ListingRow>("SELECT * FROM listings WHERE id = ?", [listingId]);
  if (!row) throw notFound("Inserat nicht gefunden.");

  /* Verlängerung hängt an die Restlaufzeit an, statt sie zu
     verschenken: Wer früh verlängert, verliert keine Tage. */
  const from =
    row.expires_at && row.expires_at > nowIso() ? new Date(row.expires_at) : new Date();

  run("UPDATE listings SET plan = ?, expires_at = ?, updated_at = ? WHERE id = ?", [
    plan,
    plusDays(days, from),
    nowIso(),
    listingId,
  ]);
  publishIfReady(listingId);
  return one<ListingRow>("SELECT * FROM listings WHERE id = ?", [listingId])!;
}

/**
 * Die eine Stelle, an der ein Inserat öffentlich wird.
 *
 * Beide Bedingungen müssen erfüllt sein: bezahlte Laufzeit und
 * bestandene Prüfung. Ein gesperrtes oder abgelehntes Inserat wird
 * hier nicht wieder wach — das entscheidet nur die Moderation.
 */
export function publishIfReady(listingId: string): boolean {
  const row = one<ListingRow & { moderated_at: string | null; rejected_reason: string | null }>(
    "SELECT * FROM listings WHERE id = ?",
    [listingId],
  );
  if (!row) throw notFound("Inserat nicht gefunden.");

  const paid = row.plan !== null && row.expires_at !== null && row.expires_at > nowIso();
  const reviewed = row.moderated_at !== null && row.rejected_reason === null;
  const publishable = ["pending_review", "expired", "active"].includes(row.status);
  if (!paid || !reviewed || !publishable) return false;

  run(
    `UPDATE listings SET status = 'active', published_at = COALESCE(published_at, ?), updated_at = ?
      WHERE id = ?`,
    [nowIso(), nowIso(), listingId],
  );
  // Mit der Freigabe des Inserats sind auch seine Bilder freigegeben.
  run("UPDATE listing_photos SET approved = 1 WHERE listing_id = ?", [listingId]);
  return true;
}

export function setOnline(accountId: string, id: string, minutes: number) {
  ownRow(accountId, id);
  const until = new Date(Date.now() + Math.min(Math.max(minutes, 0), 12 * 60) * 60_000);
  run("UPDATE listings SET online_until = ?, updated_at = ? WHERE id = ?", [
    minutes > 0 ? until.toISOString() : null,
    nowIso(),
    id,
  ]);
}

export function pause(accountId: string, id: string, paused: boolean) {
  const row = ownRow(accountId, id);
  if (paused && row.status !== "active") throw conflict("Nur aktive Inserate lassen sich pausieren.");
  if (!paused && row.status !== "paused") throw conflict("Dieses Inserat ist nicht pausiert.");
  run("UPDATE listings SET status = ?, updated_at = ? WHERE id = ?", [
    paused ? "paused" : "active",
    nowIso(),
    id,
  ]);
  return getOwn(accountId, id);
}

export function remove(accountId: string, id: string) {
  ownRow(accountId, id);
  run("DELETE FROM listings WHERE id = ?", [id]);
}

function ownRow(accountId: string, id: string): ListingRow {
  const row = one<ListingRow>("SELECT * FROM listings WHERE id = ?", [id]);
  if (!row) throw notFound("Inserat nicht gefunden.");
  if (row.account_id !== accountId) throw forbidden("Das ist nicht Ihr Inserat.");
  return row;
}

/** Eigene Sicht: mit Status, Prüfvermerk und Restlaufzeit. */
export function getOwn(accountId: string, id: string) {
  const row = ownRow(accountId, id);
  return {
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
    incall: row.incall === 1,
    outcall: row.outcall === 1,
    rates: { m30: row.rate_m30, h1: row.rate_h1, h2: row.rate_h2, night: row.rate_night },
    availability: row.availability,
    phone: row.phone,
    phoneHidden: row.phone_hidden === 1,
    services: servicesOf(id),
    languages: languagesOf(id),
    photos: all<{ id: string; storage_key: string; approved: number; position: number }>(
      "SELECT id, storage_key, approved, position FROM listing_photos WHERE listing_id = ? ORDER BY position",
      [id],
    ).map((p) => ({
      id: p.id,
      url: `/api/media/${p.storage_key}`,
      approved: p.approved === 1,
      position: p.position,
    })),
    plan: row.plan,
    verified: row.verified_at !== null,
    publishedAt: row.published_at,
    expiresAt: row.expires_at,
    /* Beide Bedingungen einzeln ausweisen: Wer wartet, soll sehen,
       woran es liegt — an der Prüfung oder an der Zahlung. */
    reviewed: row.moderated_at !== null && row.rejected_reason === null,
    paidUntil: row.expires_at,
    rejectedReason: row.rejected_reason,
    maxPhotos: row.plan ? PLANS[row.plan as PlanId].photos : PLANS.basis.photos,
  };
}

export function listOwn(accountId: string) {
  return all<{ id: string }>(
    "SELECT id FROM listings WHERE account_id = ? ORDER BY updated_at DESC",
    [accountId],
  ).map((r) => getOwn(accountId, r.id));
}
