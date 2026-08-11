/* ============================================================
   NOIRA — Taxonomie
   Regionen, Kategorien, Services, Sprachen, Tarifpakete.
   Zentral gepflegt, damit Filter, Formulare und Detailseiten
   garantiert dieselben Werte verwenden.
   ============================================================ */

export type Canton = {
  code: string;
  name: string;
  /** Grösste Städte — treiben die Städte-Navigation auf der Startseite */
  cities: string[];
};

export const CANTONS: Canton[] = [
  { code: "ZH", name: "Zürich", cities: ["Zürich", "Winterthur", "Uster", "Dietikon"] },
  { code: "BE", name: "Bern", cities: ["Bern", "Biel/Bienne", "Thun"] },
  { code: "LU", name: "Luzern", cities: ["Luzern", "Emmen", "Kriens"] },
  { code: "BS", name: "Basel-Stadt", cities: ["Basel"] },
  { code: "BL", name: "Basel-Landschaft", cities: ["Liestal", "Allschwil", "Pratteln"] },
  { code: "AG", name: "Aargau", cities: ["Aarau", "Baden", "Wettingen", "Olten-West"] },
  { code: "SG", name: "St. Gallen", cities: ["St. Gallen", "Rapperswil", "Wil"] },
  { code: "GE", name: "Genf", cities: ["Genève", "Carouge", "Meyrin"] },
  { code: "VD", name: "Waadt", cities: ["Lausanne", "Montreux", "Yverdon"] },
  { code: "TI", name: "Tessin", cities: ["Lugano", "Locarno", "Bellinzona"] },
  { code: "ZG", name: "Zug", cities: ["Zug", "Baar", "Cham"] },
  { code: "SO", name: "Solothurn", cities: ["Solothurn", "Olten", "Grenchen"] },
  { code: "SZ", name: "Schwyz", cities: ["Schwyz", "Pfäffikon SZ", "Einsiedeln"] },
  { code: "TG", name: "Thurgau", cities: ["Frauenfeld", "Kreuzlingen", "Arbon"] },
  { code: "GR", name: "Graubünden", cities: ["Chur", "Davos", "St. Moritz"] },
  { code: "VS", name: "Wallis", cities: ["Sion", "Sierre", "Brig"] },
  { code: "FR", name: "Freiburg", cities: ["Fribourg", "Bulle"] },
  { code: "NE", name: "Neuenburg", cities: ["Neuchâtel", "La Chaux-de-Fonds"] },
  { code: "SH", name: "Schaffhausen", cities: ["Schaffhausen"] },
  { code: "AR", name: "Appenzell A.Rh.", cities: ["Herisau"] },
  { code: "GL", name: "Glarus", cities: ["Glarus"] },
  { code: "JU", name: "Jura", cities: ["Delémont"] },
  { code: "NW", name: "Nidwalden", cities: ["Stans"] },
  { code: "OW", name: "Obwalden", cities: ["Sarnen"] },
  { code: "UR", name: "Uri", cities: ["Altdorf"] },
];

export type CategoryId =
  | "begleitung"
  | "massage"
  | "dominanz"
  | "trans"
  | "paare"
  | "herren"
  | "club"
  | "studio"
  | "digital";

export type Category = {
  id: CategoryId;
  label: string;
  short: string;
  description: string;
  /** Index der Eklipsen-Phase, siehe components/Phase.tsx */
  phase: number;
};

export const CATEGORIES: Category[] = [
  {
    id: "begleitung",
    label: "Begleitung & Escort",
    short: "Begleitung",
    description: "Zeit zu zweit, Dinner-Dates, Reisebegleitung.",
    phase: 0,
  },
  {
    id: "massage",
    label: "Massage & Wellness",
    short: "Massage",
    description: "Tantra, Körper-zu-Körper, Entspannung.",
    phase: 1,
  },
  {
    id: "dominanz",
    label: "Dominanz & Fetisch",
    short: "Dominanz",
    description: "BDSM, Rollenspiele, Fetisch-Sessions.",
    phase: 2,
  },
  {
    id: "trans",
    label: "Trans & Non-Binär",
    short: "Trans",
    description: "Trans*, non-binäre und queere Anbietende.",
    phase: 3,
  },
  {
    id: "paare",
    label: "Paare",
    short: "Paare",
    description: "Gemeinsame Begegnungen zu dritt oder viert.",
    phase: 4,
  },
  {
    id: "herren",
    label: "Herren",
    short: "Herren",
    description: "Männliche Begleitung für alle Geschlechter.",
    phase: 5,
  },
  {
    id: "club",
    label: "Clubs & Sauna",
    short: "Clubs",
    description: "Häuser, Sauna-Clubs und Events.",
    phase: 6,
  },
  {
    id: "studio",
    label: "Studios & Apartments",
    short: "Studios",
    description: "Feste Adressen mit mehreren Anbietenden.",
    phase: 7,
  },
  {
    id: "digital",
    label: "Digital & Cam",
    short: "Digital",
    description: "Video-Dates, Chat, digitale Inhalte.",
    phase: 8,
  },
];

export const SERVICES = [
  "Dinner-Date",
  "Reisebegleitung",
  "Übernachtung",
  "Hausbesuch",
  "Hotelbesuch",
  "Empfang im Studio",
  "Tantra",
  "Körpermassage",
  "Paar-Session",
  "Rollenspiele",
  "Soft-BDSM",
  "Bondage",
  "Fetisch",
  "Fussfetisch",
  "GFE",
  "Striptease",
  "Begleitung an Events",
  "Video-Date",
  "Foto-Shooting",
  "Sinnliches Bad",
] as const;

export type Service = (typeof SERVICES)[number];

export const LANGUAGES = [
  "Deutsch",
  "Schweizerdeutsch",
  "Französisch",
  "Italienisch",
  "Englisch",
  "Spanisch",
  "Portugiesisch",
  "Rumänisch",
  "Russisch",
  "Ungarisch",
  "Thai",
] as const;

export type Language = (typeof LANGUAGES)[number];

export const SITE_LOCALES = [
  { code: "de", label: "DE", name: "Deutsch" },
  { code: "fr", label: "FR", name: "Français" },
  { code: "it", label: "IT", name: "Italiano" },
  { code: "en", label: "EN", name: "English" },
] as const;

/* ---------------------------------------------------------------
   Inserate-Pakete. Preise in CHF, exkl. 8.1 % MWST.
   --------------------------------------------------------------- */

export type PlanId = "basis" | "plus" | "premium";

export type Plan = {
  id: PlanId;
  name: string;
  tagline: string;
  /** Preis pro Laufzeit in Tagen */
  price: Record<7 | 30 | 90, number>;
  photos: number;
  featured: boolean;
  highlight?: boolean;
  features: string[];
};

export const PLANS: Plan[] = [
  {
    id: "basis",
    name: "Basis",
    tagline: "Sichtbar bleiben, ohne Schnickschnack.",
    price: { 7: 29, 30: 79, 90: 189 },
    photos: 6,
    featured: false,
    features: [
      "Inserat in allen Suchergebnissen",
      "Bis zu 6 Fotos",
      "Telefon, SMS & WhatsApp-Kontakt",
      "Verfügbarkeitskalender",
      "Statistik: Aufrufe & Kontakte",
    ],
  },
  {
    id: "plus",
    name: "Plus",
    tagline: "Die Balance aus Reichweite und Budget.",
    price: { 7: 59, 30: 149, 90: 379 },
    photos: 15,
    featured: false,
    highlight: true,
    features: [
      "Alles aus Basis",
      "Bis zu 15 Fotos + 1 Video",
      "Täglich 1× kostenlos nach oben schieben",
      "Hervorgehobene Karte in der Trefferliste",
      "Zusätzliche Region gratis",
      "Verifizierungs-Badge inklusive",
    ],
  },
  {
    id: "premium",
    name: "Premium",
    tagline: "Erste Reihe — auf der Startseite und in der Suche.",
    price: { 7: 119, 30: 299, 90: 749 },
    photos: 40,
    featured: true,
    features: [
      "Alles aus Plus",
      "Bis zu 40 Fotos + 3 Videos",
      "Platzierung im Startseiten-Karussell",
      "Immer über den Standard-Inseraten",
      "3× täglich nach oben schieben",
      "Bis zu 3 Regionen gleichzeitig",
      "Persönliche Betreuung per Telefon",
    ],
  },
];

export const DURATIONS = [
  { days: 7 as const, label: "7 Tage", note: "Kurzer Aufenthalt" },
  { days: 30 as const, label: "30 Tage", note: "Beliebteste Wahl" },
  { days: 90 as const, label: "90 Tage", note: "Beste Ersparnis" },
];

export const VAT_RATE = 0.081;
