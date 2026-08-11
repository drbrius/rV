/* ============================================================
   Startseite
   Aufbau: Suche zuerst, Vertrauen sofort danach, dann Inhalt.
   Wer sucht, soll in zwei Klicks in der Trefferliste sein;
   wer inserieren will, findet den Weg im letzten Drittel.
   ============================================================ */

import { ListingCard } from "@/components/ListingCard";
import { Portrait } from "@/components/Portrait";
import { LISTINGS, NEWEST_LISTINGS, PREMIUM_LISTINGS, countByCategory } from "@/data/listings";
import { CANTONS, CATEGORIES } from "@/data/taxonomy";
import { compactNumber } from "@/lib/format";
import {
  ArrowRight,
  BadgeCheck,
  Bitcoin,
  ChevronDown,
  CreditCard,
  Lock,
  Search,
  ShieldCheck,
  Sparkles,
} from "lucide-react";
import { useState } from "react";
import { Link, useLocation } from "wouter";

/* Kennzahlen kommen in Produktion aus `GET /api/stats`; hier fixiert,
   damit das Layout mit realistischen Grössenordnungen abgenommen wird. */
const STATS = [
  { value: "3'180", label: "aktive Inserate" },
  { value: "26", label: "Kantone" },
  { value: "94 %", label: "verifizierte Profile" },
  { value: "< 2 Std.", label: "bis zur Freischaltung" },
];

const FAQ = [
  {
    q: "Was kostet die Nutzung für Suchende?",
    a: "Nichts. Suchen, filtern, Profile ansehen und Kontakt aufnehmen ist vollständig kostenlos und ohne Konto möglich. Bezahlt wird nur, wer inseriert.",
  },
  {
    q: "Wie funktioniert die Verifizierung?",
    a: "Anbietende laden ein Selfie mit einem tagesaktuellen Codewort und ein amtliches Ausweisdokument hoch. Wir prüfen Alter und Übereinstimmung mit den Fotos, speichern den Ausweis verschlüsselt und löschen ihn 90 Tage nach Ablauf des Inserats. Erst danach erscheint das Verifiziert-Zeichen.",
  },
  {
    q: "Womit kann ich ein Inserat bezahlen?",
    a: "Mit Kreditkarte (Visa, Mastercard, American Express), mit TWINT oder mit Kryptowährung (Bitcoin, Ethereum, USDT). Auf der Kartenabrechnung erscheint ausschliesslich die neutrale Bezeichnung «NM DIGITAL GMBH».",
  },
  {
    q: "Vermittelt NOIRA Termine oder Personen?",
    a: "Nein. NOIRA stellt ausschliesslich die Inserateplattform. Absprachen, Preise und Bedingungen werden direkt zwischen den Beteiligten getroffen — wir sind daran weder beteiligt noch verdienen wir daran mit.",
  },
  {
    q: "Wie melde ich ein Inserat?",
    a: "Auf jedem Profil finden Sie den Link «Inserat melden». Meldungen zu Zwang, Minderjährigen oder Menschenhandel werden innerhalb einer Stunde bearbeitet, das Inserat wird bis zur Klärung deaktiviert.",
  },
];

function HeroSearch() {
  const [, navigate] = useLocation();
  const [canton, setCanton] = useState("");
  const [category, setCategory] = useState("");
  const [q, setQ] = useState("");

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    const params = new URLSearchParams();
    if (canton) params.set("kanton", canton);
    if (category) params.set("kategorie", category);
    if (q.trim()) params.set("q", q.trim());
    navigate(`/inserate${params.toString() ? `?${params}` : ""}`);
  };

  const selectClass =
    "w-full appearance-none rounded-lg border border-line bg-surface-2/60 px-4 py-3.5 pr-10 text-sm text-foreground focus:border-gold/60 focus:outline-none";

  return (
    <form
      onSubmit={submit}
      className="rounded-2xl border border-line bg-surface/80 p-3 backdrop-blur-xl sm:p-4">
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-[1fr_1fr_1.4fr_auto]">
        <div className="relative">
          <select
            value={canton}
            onChange={(e) => setCanton(e.target.value)}
            aria-label="Region wählen"
            className={selectClass}>
            <option value="">Ganze Schweiz</option>
            {CANTONS.map((c) => (
              <option key={c.code} value={c.code}>
                {c.name}
              </option>
            ))}
          </select>
          <ChevronDown
            className="pointer-events-none absolute top-1/2 right-3 h-4 w-4 -translate-y-1/2 text-muted-foreground"
            strokeWidth={1.6}
          />
        </div>

        <div className="relative">
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            aria-label="Kategorie wählen"
            className={selectClass}>
            <option value="">Alle Kategorien</option>
            {CATEGORIES.map((c) => (
              <option key={c.id} value={c.id}>
                {c.label}
              </option>
            ))}
          </select>
          <ChevronDown
            className="pointer-events-none absolute top-1/2 right-3 h-4 w-4 -translate-y-1/2 text-muted-foreground"
            strokeWidth={1.6}
          />
        </div>

        <label className="relative block">
          <Search
            className="pointer-events-none absolute top-1/2 left-4 h-4 w-4 -translate-y-1/2 text-muted-foreground"
            strokeWidth={1.6}
          />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Name, Stadt oder Service"
            aria-label="Suchbegriff"
            className="w-full rounded-lg border border-line bg-surface-2/60 py-3.5 pr-4 pl-11 text-sm placeholder:text-muted-foreground/70 focus:border-gold/60 focus:outline-none"
          />
        </label>

        <button
          type="submit"
          className="rounded-lg bg-gold px-7 py-3.5 text-sm font-semibold text-ink transition hover:brightness-110 active:scale-[0.99]">
          Suchen
        </button>
      </div>
    </form>
  );
}

export default function Home() {
  const premium = PREMIUM_LISTINGS.slice(0, 4);
  const newest = NEWEST_LISTINGS.slice(0, 8);
  const cities = CANTONS.flatMap((c) => c.cities.slice(0, 2).map((city) => ({ city, code: c.code })));

  return (
    <>
      {/* ---------- Hero ---------- */}
      <section className="relative overflow-hidden pt-14 pb-20 sm:pt-20">
        <div className="aura -top-40 -left-32 h-[30rem] w-[30rem]" style={{ background: "#6D2C4E" }} />
        <div
          className="aura top-10 right-0 h-[26rem] w-[26rem] opacity-30"
          style={{ background: "#9A7434" }}
        />

        <div className="container-noira relative">
          <p className="eyebrow fade-up mb-6">Schweiz · Diskret · Ab 18</p>
          <h1
            className="display fade-up max-w-4xl text-[clamp(2.75rem,7.5vw,5.5rem)]"
            style={{ animationDelay: "60ms" }}>
            Begegnungen mit
            <br />
            <span className="text-gilded italic">Stil und Diskretion.</span>
          </h1>
          <p
            className="fade-up mt-7 max-w-xl text-base leading-relaxed text-muted-foreground sm:text-lg"
            style={{ animationDelay: "120ms" }}>
            NOIRA ist die Schweizer Plattform für erotische Inserate — kuratiert, verifiziert und
            ohne Vermittlung. Sie finden hier keine Agentur, sondern Menschen, die selbstbestimmt
            über ihr Angebot entscheiden.
          </p>

          <div className="fade-up mt-10 max-w-4xl" style={{ animationDelay: "180ms" }}>
            <HeroSearch />
          </div>

          <dl
            className="fade-up mt-10 grid max-w-3xl grid-cols-2 gap-x-6 gap-y-6 sm:grid-cols-4"
            style={{ animationDelay: "240ms" }}>
            {STATS.map((s) => (
              <div key={s.label}>
                <dt className="display text-3xl text-foreground">{s.value}</dt>
                <dd className="mt-1 text-xs text-muted-foreground">{s.label}</dd>
              </div>
            ))}
          </dl>
        </div>
      </section>

      {/* ---------- Kategorien ---------- */}
      <section className="container-noira">
        <div className="rule mb-12" />
        <div className="mb-8 flex items-end justify-between gap-4">
          <div>
            <p className="eyebrow mb-3">Kategorien</p>
            <h2 className="display text-3xl sm:text-4xl">Wonach suchen Sie?</h2>
          </div>
          <Link
            href="/inserate"
            className="hidden shrink-0 items-center gap-1.5 text-sm text-gold-soft transition hover:text-gold sm:flex">
            Alle Inserate <ArrowRight className="h-4 w-4" strokeWidth={1.6} />
          </Link>
        </div>

        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
          {CATEGORIES.map((c) => (
            <Link
              key={c.id}
              href={`/inserate?kategorie=${c.id}`}
              className="card-noir group flex flex-col justify-between p-5 hover:-translate-y-0.5">
              <span className="text-2xl text-gold-soft transition group-hover:text-gold">
                {c.glyph}
              </span>
              <span className="mt-8">
                <span className="block text-sm font-medium text-foreground">{c.short}</span>
                <span className="mt-1 block text-xs text-muted-foreground">
                  {countByCategory(c.id)} Inserate
                </span>
              </span>
            </Link>
          ))}
        </div>
      </section>

      {/* ---------- Premium ---------- */}
      <section className="container-noira mt-24">
        <div className="mb-8 flex items-end justify-between gap-4">
          <div>
            <p className="eyebrow mb-3 flex items-center gap-2">
              <Sparkles className="h-3.5 w-3.5" strokeWidth={1.8} /> Empfohlen
            </p>
            <h2 className="display text-3xl sm:text-4xl">Premium-Inserate</h2>
            <p className="mt-2 max-w-md text-sm text-muted-foreground">
              Bezahlte Platzierungen. Alle Premium-Profile durchlaufen zwingend die Verifizierung.
            </p>
          </div>
          <Link
            href="/inserate?sortierung=premium"
            className="hidden shrink-0 items-center gap-1.5 text-sm text-gold-soft transition hover:text-gold sm:flex">
            Mehr anzeigen <ArrowRight className="h-4 w-4" strokeWidth={1.6} />
          </Link>
        </div>

        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          {premium.map((l) => (
            <ListingCard key={l.id} listing={l} priority />
          ))}
        </div>
      </section>

      {/* ---------- Vertrauen ---------- */}
      <section className="container-noira mt-24">
        <div className="grid gap-4 md:grid-cols-3">
          {[
            {
              icon: BadgeCheck,
              title: "Geprüfte Profile",
              text: "Ausweis- und Selfie-Abgleich vor der Freischaltung. Verifizierte Inserate tragen ein Zeichen, das man nicht kaufen kann — nur verdienen.",
            },
            {
              icon: Lock,
              title: "Diskret bezahlen",
              text: "Kreditkarte, TWINT oder Krypto. Auf der Abrechnung steht eine neutrale Bezeichnung, nie «NOIRA» und nie ein Hinweis auf die Branche.",
            },
            {
              icon: ShieldCheck,
              title: "Klare Regeln",
              text: "Kein Zwang, keine Minderjährigen, keine Vermittlung. Meldungen werden innerhalb einer Stunde bearbeitet — rund um die Uhr, auch am Wochenende.",
            },
          ].map((f) => (
            <div key={f.title} className="card-noir p-7">
              <f.icon className="mb-5 h-6 w-6 text-gold" strokeWidth={1.4} />
              <h3 className="display mb-2.5 text-2xl">{f.title}</h3>
              <p className="text-sm leading-relaxed text-muted-foreground">{f.text}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ---------- Neu ---------- */}
      <section className="container-noira mt-24">
        <div className="mb-8 flex items-end justify-between gap-4">
          <div>
            <p className="eyebrow mb-3">Frisch eingetroffen</p>
            <h2 className="display text-3xl sm:text-4xl">Neu auf NOIRA</h2>
          </div>
          <Link
            href="/inserate?sortierung=neu"
            className="hidden shrink-0 items-center gap-1.5 text-sm text-gold-soft transition hover:text-gold sm:flex">
            Alle Neuzugänge <ArrowRight className="h-4 w-4" strokeWidth={1.6} />
          </Link>
        </div>

        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          {newest.map((l) => (
            <ListingCard key={l.id} listing={l} />
          ))}
        </div>
      </section>

      {/* ---------- Städte ---------- */}
      <section className="container-noira mt-24">
        <div className="rule mb-12" />
        <p className="eyebrow mb-3">Regionen</p>
        <h2 className="display mb-8 text-3xl sm:text-4xl">In Ihrer Nähe</h2>
        <div className="flex flex-wrap gap-2">
          {cities.map((c) => (
            <Link
              key={`${c.code}-${c.city}`}
              href={`/inserate?kanton=${c.code}`}
              className="rounded-full border border-line px-4 py-2 text-sm text-muted-foreground transition hover:border-gold/50 hover:text-foreground">
              {c.city}
            </Link>
          ))}
        </div>
      </section>

      {/* ---------- Für Anbietende ---------- */}
      <section className="container-noira mt-24">
        <div className="card-noir relative grid items-center gap-10 overflow-hidden p-8 lg:grid-cols-[1.2fr_1fr] lg:p-14">
          <div
            className="aura -right-20 -bottom-32 h-96 w-96"
            style={{ background: "#9A7434" }}
          />
          <div className="relative">
            <p className="eyebrow mb-4">Für Anbietende</p>
            <h2 className="display mb-5 text-4xl sm:text-5xl">
              Ihr Inserat. <span className="text-gilded">Ihre Regeln.</span>
            </h2>
            <p className="mb-7 max-w-lg text-sm leading-relaxed text-muted-foreground">
              Sie bestimmen Preise, Zeiten und Bedingungen — wir liefern Reichweite, Statistik und
              eine Bezahlung, die auf keinem Kontoauszug erklärt werden muss. Keine Provision auf
              Ihre Einnahmen, keine versteckten Gebühren, jederzeit kündbar.
            </p>

            <ul className="mb-8 grid gap-2.5 text-sm text-muted-foreground sm:grid-cols-2">
              {[
                "Ab CHF 29 für 7 Tage",
                "Freischaltung in unter 2 Stunden",
                "Kreditkarte, TWINT oder Krypto",
                "Rufnummer optional verborgen",
              ].map((i) => (
                <li key={i} className="flex items-center gap-2">
                  <span className="text-gold">—</span>
                  {i}
                </li>
              ))}
            </ul>

            <div className="flex flex-wrap gap-3">
              <Link
                href="/werben"
                className="rounded-full bg-gold px-6 py-3.5 text-sm font-semibold text-ink transition hover:brightness-110">
                Inserat aufgeben
              </Link>
              <Link
                href="/werben#preise"
                className="rounded-full border border-line px-6 py-3.5 text-sm text-foreground transition hover:border-gold/50">
                Preise ansehen
              </Link>
            </div>

            <p className="mt-6 flex flex-wrap items-center gap-4 text-xs text-muted-foreground/80">
              <span className="flex items-center gap-1.5">
                <CreditCard className="h-3.5 w-3.5" strokeWidth={1.6} /> Visa · Mastercard · Amex ·
                TWINT
              </span>
              <span className="flex items-center gap-1.5">
                <Bitcoin className="h-3.5 w-3.5" strokeWidth={1.6} /> BTC · ETH · USDT
              </span>
            </p>
          </div>

          {/* Andeutung des Inserate-Layouts statt eines Stockfotos */}
          <div className="relative hidden lg:block">
            <div className="grid grid-cols-2 gap-3">
              {LISTINGS.slice(0, 4).map((l, i) => (
                <div
                  key={l.id}
                  className="overflow-hidden rounded-xl border border-line"
                  style={{ transform: `translateY(${i % 2 ? "1.5rem" : "0"})` }}>
                  <Portrait name={l.name} motif={l.motif} className="aspect-[3/4]" compact />
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ---------- FAQ ---------- */}
      <section className="container-noira mt-24">
        <div className="grid gap-10 lg:grid-cols-[0.8fr_1.2fr]">
          <div>
            <p className="eyebrow mb-3">Häufige Fragen</p>
            <h2 className="display text-3xl sm:text-4xl">Gut zu wissen</h2>
            <p className="mt-4 text-sm leading-relaxed text-muted-foreground">
              Keine Antwort gefunden? Der Support ist täglich von 9 bis 22 Uhr erreichbar —
              schriftlich unter{" "}
              <span className="text-gold-soft">support@noira.ch</span>.
            </p>
          </div>

          <div className="divide-y divide-[color:var(--noira-line)] border-y border-line">
            {FAQ.map((f) => (
              <details key={f.q} className="group py-5">
                <summary className="flex cursor-pointer list-none items-center justify-between gap-4 text-base text-foreground marker:hidden">
                  {f.q}
                  <ChevronDown
                    className="h-4 w-4 shrink-0 text-muted-foreground transition group-open:rotate-180"
                    strokeWidth={1.6}
                  />
                </summary>
                <p className="mt-3 max-w-2xl text-sm leading-relaxed text-muted-foreground">
                  {f.a}
                </p>
              </details>
            ))}
          </div>
        </div>
      </section>

      {/* ---------- Abschluss ---------- */}
      <section className="container-noira mt-24 text-center">
        <div className="rule mb-14" />
        <p className="eyebrow mb-5">
          {compactNumber(LISTINGS.reduce((s, l) => s + l.views, 0))} Profilaufrufe diesen Monat
        </p>
        <h2 className="display mx-auto max-w-2xl text-4xl sm:text-5xl">
          Bereit, jemanden <span className="text-gilded italic">kennenzulernen?</span>
        </h2>
        <Link
          href="/inserate"
          className="mt-8 inline-flex items-center gap-2 rounded-full bg-gold px-8 py-4 text-sm font-semibold text-ink transition hover:brightness-110">
          Alle Inserate durchsuchen <ArrowRight className="h-4 w-4" strokeWidth={2} />
        </Link>
      </section>
    </>
  );
}
