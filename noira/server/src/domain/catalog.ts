/* ============================================================
   Katalog: Kantone, Kategorien, Services, Sprachen, Pakete.

   Der Server ist hier die Wahrheit, nicht der Browser. Die
   Oberfläche darf dieselben Listen anzeigen, aber prüfen muss sie
   der Server — sonst legt jemand ein Inserat in der Kategorie
   „gratis-ganz-oben" an.

   Ausgeliefert über GET /api/catalog, damit die Oberfläche die
   Listen nicht doppelt pflegen muss.
   ============================================================ */

export const CANTONS = [
  "ZH", "BE", "LU", "BS", "BL", "AG", "SG", "GE", "VD", "TI", "ZG", "SO",
  "SZ", "TG", "GR", "VS", "FR", "NE", "SH", "AR", "AI", "GL", "JU", "NW",
  "OW", "UR",
] as const;
export type Canton = (typeof CANTONS)[number];

export const CATEGORIES = [
  "begleitung", "massage", "dominanz", "trans", "paare", "herren",
  "club", "studio", "digital",
] as const;
export type Category = (typeof CATEGORIES)[number];

export const SERVICES = [
  "Dinner-Date", "Reisebegleitung", "Übernachtung", "Hausbesuch", "Hotelbesuch",
  "Empfang im Studio", "Tantra", "Körpermassage", "Paar-Session", "Rollenspiele",
  "Soft-BDSM", "Bondage", "Fetisch", "Fussfetisch", "GFE", "Striptease",
  "Begleitung an Events", "Video-Date", "Foto-Shooting", "Sinnliches Bad",
] as const;
export type Service = (typeof SERVICES)[number];

export const LANGUAGES = [
  "Deutsch", "Schweizerdeutsch", "Französisch", "Italienisch", "Englisch",
  "Spanisch", "Portugiesisch", "Rumänisch", "Russisch", "Ungarisch", "Thai",
] as const;
export type Language = (typeof LANGUAGES)[number];

export const LOCALES = ["de", "fr", "it", "en"] as const;

/* --- Pakete -------------------------------------------------------
   Preise in Rappen. Niemals Fliesskomma für Geld: 79.90 ist als
   double nicht darstellbar, 7990 als Ganzzahl exakt. */

export type PlanId = "basis" | "plus" | "premium";
export type Duration = 7 | 30 | 90;

export const PLANS: Record<
  PlanId,
  { photos: number; videos: number; featured: boolean; regions: number; price: Record<Duration, number> }
> = {
  basis: {
    photos: 6,
    videos: 0,
    featured: false,
    regions: 1,
    price: { 7: 2_900, 30: 7_900, 90: 18_900 },
  },
  plus: {
    photos: 15,
    videos: 1,
    featured: false,
    regions: 2,
    price: { 7: 5_900, 30: 14_900, 90: 37_900 },
  },
  premium: {
    photos: 40,
    videos: 3,
    featured: true,
    regions: 3,
    price: { 7: 11_900, 30: 29_900, 90: 74_900 },
  },
};

export const DURATIONS: Duration[] = [7, 30, 90];

/** Mehrwertsteuer in Basispunkten: 810 = 8.1 %. */
export const VAT_RATE_BP = 810;

/**
 * Rechnet den Betrag einer Bestellung.
 * Die Steuer wird auf 5 Rappen gerundet — so steht es auf jeder
 * Schweizer Rechnung, und so muss es der Server rechnen, nicht die
 * Oberfläche.
 */
export function priceOrder(plan: PlanId, duration: Duration) {
  const net = PLANS[plan].price[duration];
  const exact = (net * VAT_RATE_BP) / 10_000;
  const vat = Math.round(exact / 5) * 5;
  return { net, vatRateBp: VAT_RATE_BP, vat, total: net + vat };
}

export const isCanton = (v: unknown): v is Canton =>
  typeof v === "string" && (CANTONS as readonly string[]).includes(v);
export const isCategory = (v: unknown): v is Category =>
  typeof v === "string" && (CATEGORIES as readonly string[]).includes(v);
export const isService = (v: unknown): v is Service =>
  typeof v === "string" && (SERVICES as readonly string[]).includes(v);
export const isLanguage = (v: unknown): v is Language =>
  typeof v === "string" && (LANGUAGES as readonly string[]).includes(v);

/* --- Verifizierungs-Codewort --------------------------------------
   Wechselt täglich und muss auf dem Selfie sichtbar sein. Damit ist
   belegt, dass die Aufnahme von heute stammt — ein altes Bild aus
   dem Netz hat das Wort nicht. */

const CODEWORDS = [
  "ALPENGLÜHEN", "NACHTBLAU", "SEIDENPAPIER", "GOLDREGEN", "FLUSSKIESEL",
  "MONDSICHEL", "TANNENHARZ", "SAMTHANDSCHUH", "WINTERLICHT", "GLASPERLE",
  "ABENDROT", "SCHIEFERGRAU", "KIRSCHHOLZ", "NEBELHORN",
];

export function codewordOfDay(date = new Date()): string {
  const day = Math.floor(date.getTime() / 86_400_000);
  return CODEWORDS[day % CODEWORDS.length];
}
