/* Suche, Filter, Sortierung — gegen Zeilen, die direkt in die
   Datenbank geschrieben werden. Der Weg über die Oberfläche ist
   anderswo getestet; hier geht es nur um das SQL. */

import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { closeDatabase, openDatabase, run } from "../src/db/index.js";
import { expireListings, searchListings } from "../src/domain/listings.js";
import { runMaintenance } from "../src/jobs.js";
import { nowIso, plusDays } from "../src/lib/http.js";
import { newId } from "../src/lib/ids.js";

type Sample = {
  slug: string;
  canton: string;
  category?: string;
  city?: string;
  h1: number;
  plan?: "basis" | "plus" | "premium" | null;
  verified?: boolean;
  services?: string[];
  languages?: string[];
  video?: boolean;
  online?: boolean;
  outcall?: boolean;
  published?: string;
  expires?: string | null;
};

function insert(s: Sample) {
  const id = newId("lst");
  run(
    `INSERT INTO listings
       (id, account_id, slug, status, name, age, category, canton, city, tagline, about,
        incall, outcall, rate_h1, availability, phone, has_video, online_until, plan,
        published_at, expires_at, verified_at, moderated_at, created_at, updated_at)
     VALUES (?, 'acc_test', ?, 'active', ?, 30, ?, ?, ?, '', '', 1, ?, ?, '', '079 000 00 00',
             ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      id,
      s.slug,
      s.slug,
      s.category ?? "begleitung",
      s.canton,
      s.city ?? "Zürich",
      s.outcall ? 1 : 0,
      s.h1,
      s.video ? 1 : 0,
      s.online ? plusDays(1) : null,
      s.plan ?? null,
      s.published ?? nowIso(),
      s.expires === undefined ? plusDays(30) : s.expires,
      s.verified ? nowIso() : null,
      nowIso(),
      nowIso(),
      nowIso(),
    ],
  );
  for (const service of s.services ?? [])
    run("INSERT INTO listing_services (listing_id, service) VALUES (?, ?)", [id, service]);
  for (const language of s.languages ?? [])
    run("INSERT INTO listing_languages (listing_id, language) VALUES (?, ?)", [id, language]);
  return id;
}

beforeAll(() => {
  openDatabase();
  run(
    `INSERT INTO accounts (id, email, password_hash, role, created_at, updated_at)
     VALUES ('acc_test', 'such@test.ch', 'x', 'advertiser', ?, ?)`,
    [nowIso(), nowIso()],
  );

  insert({
    slug: "a-zuerich",
    canton: "ZH",
    h1: 45_000,
    plan: "premium",
    verified: true,
    services: ["Dinner-Date", "GFE", "Hotelbesuch"],
    languages: ["Deutsch", "Englisch"],
    video: true,
    online: true,
    published: "2026-01-01T00:00:00.000Z",
  });
  insert({
    slug: "b-bern",
    canton: "BE",
    h1: 30_000,
    plan: "basis",
    services: ["Dinner-Date"],
    languages: ["Französisch"],
    published: "2026-06-01T00:00:00.000Z",
    outcall: true,
  });
  insert({
    slug: "c-basel",
    canton: "BS",
    category: "massage",
    city: "Basel",
    h1: 22_000,
    plan: "plus",
    verified: true,
    services: ["Tantra", "Körpermassage"],
    languages: ["Deutsch", "Italienisch"],
    published: "2026-08-01T00:00:00.000Z",
  });
});

afterAll(() => closeDatabase());

describe("Filter", () => {
  it("findet alles ohne Filter", () => {
    expect(searchListings({}).total).toBe(3);
  });

  it("filtert nach Kanton und Kategorie", () => {
    expect(searchListings({ kanton: "BE" }).total).toBe(1);
    expect(searchListings({ kategorie: "massage" }).total).toBe(1);
    expect(searchListings({ kanton: "BE", kategorie: "massage" }).total).toBe(0);
  });

  it("verknüpft Services mit UND", () => {
    expect(searchListings({ services: ["Dinner-Date"] }).total).toBe(2);
    // Beide zusammen hat nur eines.
    expect(searchListings({ services: ["Dinner-Date", "GFE"] }).total).toBe(1);
    expect(searchListings({ services: ["Dinner-Date", "Tantra"] }).total).toBe(0);
  });

  it("verknüpft Sprachen mit ODER", () => {
    expect(searchListings({ sprachen: ["Französisch"] }).total).toBe(1);
    // Wer eine der beiden spricht, passt.
    expect(searchListings({ sprachen: ["Französisch", "Italienisch"] }).total).toBe(2);
  });

  it("begrenzt nach Höchstpreis", () => {
    expect(searchListings({ preis: 30_000 }).total).toBe(2);
    expect(searchListings({ preis: 20_000 }).total).toBe(0);
  });

  it("kennt die Merkmalsfilter", () => {
    expect(searchListings({ verifiziert: true }).total).toBe(2);
    expect(searchListings({ video: true }).total).toBe(1);
    expect(searchListings({ online: true }).total).toBe(1);
    expect(searchListings({ besuch: true }).total).toBe(1);
  });

  it("sucht in Name, Ort und Text", () => {
    expect(searchListings({ q: "basel" }).total).toBe(1);
    expect(searchListings({ q: "gibtsnicht" }).total).toBe(0);
    // Zwei Wörter: beide müssen vorkommen.
    expect(searchListings({ q: "c basel" }).total).toBe(1);
    expect(searchListings({ q: "basel bern" }).total).toBe(0);
  });
});

describe("Sortierung", () => {
  it("stellt bei Empfohlen bezahlte Plätze voran", () => {
    const slugs = searchListings({ sortierung: "relevanz" }).items.map((i) => i.slug);
    expect(slugs[0]).toBe("a-zuerich"); // premium
    expect(slugs[1]).toBe("c-basel"); // plus, verifiziert
  });

  it("sortiert nach Aktualität und Preis", () => {
    expect(searchListings({ sortierung: "neu" }).items[0]!.slug).toBe("c-basel");
    expect(searchListings({ sortierung: "preis-auf" }).items[0]!.slug).toBe("c-basel");
    expect(searchListings({ sortierung: "preis-ab" }).items[0]!.slug).toBe("a-zuerich");
  });

  it("blättert", () => {
    const page1 = searchListings({ limit: 2, page: 1 });
    const page2 = searchListings({ limit: 2, page: 2 });
    expect(page1.items).toHaveLength(2);
    expect(page2.items).toHaveLength(1);
    expect(page1.pages).toBe(2);
    expect(page1.items[0]!.slug).not.toBe(page2.items[0]!.slug);
  });

  it("gibt nach aussen keine Kontodaten preis", () => {
    const item = searchListings({}).items[0] as Record<string, unknown>;
    expect(item.account_id).toBeUndefined();
    expect(item.phone).toBeUndefined();
    expect(item.status).toBeUndefined();
  });
});

describe("Wartung", () => {
  it("nimmt abgelaufene Inserate aus der Suche", () => {
    insert({ slug: "d-abgelaufen", canton: "ZG", h1: 25_000, expires: "2020-01-01T00:00:00.000Z" });
    // Noch in der Datenbank, aber bereits durch die Ablauffrist gefiltert.
    expect(searchListings({}).total).toBe(3);

    expect(expireListings()).toBe(1);
    expect(searchListings({}).total).toBe(3);
    // Ein zweiter Lauf findet nichts mehr — die Wartung ist wiederholbar.
    expect(expireListings()).toBe(0);
  });

  it("läuft vollständig durch und meldet, was sie getan hat", () => {
    const result = runMaintenance();
    expect(result).toHaveProperty("expiredListings");
    expect(result).toHaveProperty("staleOrders");
    expect(result).toHaveProperty("purgedDocuments");
    expect(result).toHaveProperty("sessions");
  });
});
