/* ============================================================
   Inserat-Detailseite
   Links Inhalt, rechts eine mitlaufende Kontaktkarte — die
   Telefonnummer wird erst auf Klick sichtbar. Das bremst
   Scraper und macht die Kontaktaufnahme messbar.
   ============================================================ */

import { ListingCard } from "@/components/ListingCard";
import { Portrait } from "@/components/Portrait";
import { LISTINGS, listingBySlug } from "@/data/listings";
import { toggleSaved, useSavedIds } from "@/hooks/useSaved";
import { CANTONS, CATEGORIES } from "@/data/taxonomy";
import { chf, compactNumber, relativeDay } from "@/lib/format";
import { cn } from "@/lib/utils";
import {
  BadgeCheck,
  CalendarClock,
  ChevronLeft,
  ChevronRight,
  Flag,
  Globe,
  Heart,
  MapPin,
  MessageSquare,
  Phone,
  Play,
  Share2,
  ShieldAlert,
  Sparkles,
} from "lucide-react";
import { useEffect, useState } from "react";
import { Link, useParams } from "wouter";
import { toast } from "sonner";
import NotFound from "./NotFound";

export default function ListingDetail() {
  const { slug } = useParams<{ slug: string }>();
  const listing = listingBySlug(slug ?? "");
  const [active, setActive] = useState(0);
  const [phoneShown, setPhoneShown] = useState(false);
  const savedIds = useSavedIds();

  // Beim Wechsel auf ein anderes Inserat bleibt die Komponente montiert —
  // Galerie und aufgedeckte Nummer müssen darum von Hand zurückgesetzt werden.
  useEffect(() => {
    setActive(0);
    setPhoneShown(false);
  }, [slug]);

  if (!listing) return <NotFound />;

  const saved = savedIds.includes(listing.id);
  const canton = CANTONS.find((c) => c.code === listing.canton);
  const category = CATEGORIES.find((c) => c.id === listing.category);
  // Die Demo hat keine echten Bilder — wir zeigen so viele Motive,
  // wie das Inserat Fotos hätte (max. 6 in der Galerie).
  const gallery = Array.from({ length: Math.min(listing.photos, 6) }, (_, i) => (listing.motif + i) % 6);

  const similar = LISTINGS.filter(
    (l) => l.id !== listing.id && (l.category === listing.category || l.canton === listing.canton),
  ).slice(0, 4);

  const share = async () => {
    const url = window.location.href;
    try {
      if (navigator.share) await navigator.share({ title: `${listing.name} — NOIRA`, url });
      else {
        await navigator.clipboard.writeText(url);
        toast.success("Link kopiert");
      }
    } catch {
      /* Abbruch durch die Nutzerin oder den Nutzer — nichts zu tun */
    }
  };

  return (
    <div className="container-noira py-8">
      <nav className="mb-6 flex items-center gap-2 text-xs text-muted-foreground">
        <Link href="/inserate" className="transition hover:text-foreground">
          Inserate
        </Link>
        <ChevronRight className="h-3 w-3" strokeWidth={1.6} />
        <Link
          href={`/inserate?kanton=${listing.canton}`}
          className="transition hover:text-foreground">
          {canton?.name}
        </Link>
        <ChevronRight className="h-3 w-3" strokeWidth={1.6} />
        <span className="text-foreground">{listing.name}</span>
      </nav>

      <div className="grid gap-10 lg:grid-cols-[1.5fr_1fr]">
        {/* ---------- Inhalt ---------- */}
        <div>
          {/* Galerie */}
          <div className="relative overflow-hidden rounded-2xl border border-line">
            <Portrait
              name={listing.name}
              motif={gallery[active]}
              className="aspect-[4/3] w-full sm:aspect-[3/2]"
            />

            {gallery.length > 1 && (
              <>
                <button
                  onClick={() => setActive((a) => (a - 1 + gallery.length) % gallery.length)}
                  className="absolute top-1/2 left-3 -translate-y-1/2 rounded-full bg-black/50 p-2.5 backdrop-blur-sm transition hover:bg-black/70"
                  aria-label="Vorheriges Bild">
                  <ChevronLeft className="h-4 w-4" strokeWidth={1.8} />
                </button>
                <button
                  onClick={() => setActive((a) => (a + 1) % gallery.length)}
                  className="absolute top-1/2 right-3 -translate-y-1/2 rounded-full bg-black/50 p-2.5 backdrop-blur-sm transition hover:bg-black/70"
                  aria-label="Nächstes Bild">
                  <ChevronRight className="h-4 w-4" strokeWidth={1.8} />
                </button>
              </>
            )}

            <div className="absolute top-4 left-4 flex gap-2">
              {listing.premium && (
                <span className="flex items-center gap-1 rounded-full bg-gold px-3 py-1.5 font-mono text-[0.625rem] font-semibold tracking-widest text-ink uppercase">
                  <Sparkles className="h-3 w-3" strokeWidth={2} /> Premium
                </span>
              )}
              {listing.hasVideo && (
                <span className="flex items-center gap-1.5 rounded-full bg-black/60 px-3 py-1.5 text-xs backdrop-blur-sm">
                  <Play className="h-3 w-3 fill-current" /> Video ansehen
                </span>
              )}
            </div>

            <div className="absolute right-4 bottom-4 rounded-full bg-black/55 px-3 py-1 font-mono text-xs backdrop-blur-sm">
              {active + 1} / {gallery.length}
            </div>
          </div>

          {gallery.length > 1 && (
            <div className="no-scrollbar mt-3 flex gap-2 overflow-x-auto">
              {gallery.map((m, i) => (
                <button
                  key={i}
                  onClick={() => setActive(i)}
                  className={cn(
                    "shrink-0 overflow-hidden rounded-lg border transition",
                    i === active ? "border-gold" : "border-line opacity-60 hover:opacity-100",
                  )}
                  aria-label={`Bild ${i + 1} anzeigen`}>
                  <Portrait name={listing.name} motif={m} className="h-16 w-20" compact />
                </button>
              ))}
              {listing.photos > gallery.length && (
                <div className="flex h-16 w-20 shrink-0 items-center justify-center rounded-lg border border-line text-xs text-muted-foreground">
                  +{listing.photos - gallery.length}
                </div>
              )}
            </div>
          )}

          {/* Kopf */}
          <div className="mt-8 flex flex-wrap items-start justify-between gap-4">
            <div>
              <h1 className="display flex items-center gap-3 text-4xl sm:text-5xl">
                {listing.name}
                {listing.age > 0 && (
                  <span className="text-2xl text-muted-foreground">{listing.age}</span>
                )}
                {listing.verified && (
                  <BadgeCheck className="h-6 w-6 text-verified" strokeWidth={1.6} />
                )}
              </h1>
              <p className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-muted-foreground">
                <span className="flex items-center gap-1.5">
                  <MapPin className="h-3.5 w-3.5" strokeWidth={1.6} />
                  {listing.city}, {canton?.name}
                </span>
                <span className="text-text-3">·</span>
                <Link
                  href={`/inserate?kategorie=${listing.category}`}
                  className="transition hover:text-foreground">
                  {category?.label}
                </Link>
                <span className="text-text-3">·</span>
                <span>{compactNumber(listing.views)} Aufrufe</span>
              </p>
            </div>

            <div className="flex gap-2">
              <button
                onClick={() => {
                  const now = toggleSaved(listing.id);
                  toast.success(now ? "Zur Merkliste hinzugefügt" : "Aus Merkliste entfernt");
                }}
                className={cn(
                  "rounded-full border p-3 transition",
                  saved ? "border-orchid text-orchid" : "border-line hover:border-foreground/40",
                )}
                aria-label={saved ? "Nicht mehr merken" : "Merken"}
                aria-pressed={saved}>
                <Heart className={cn("h-4 w-4", saved && "fill-current")} strokeWidth={1.6} />
              </button>
              <button
                onClick={share}
                className="rounded-full border border-line p-3 transition hover:border-foreground/40"
                aria-label="Teilen">
                <Share2 className="h-4 w-4" strokeWidth={1.6} />
              </button>
            </div>
          </div>

          <p className="display mt-6 text-2xl leading-snug text-foreground/90 italic">
            «{listing.tagline}»
          </p>

          <div className="rule my-8" />

          <h2 className="eyebrow mb-4">Über mich</h2>
          <p className="max-w-2xl leading-relaxed whitespace-pre-line text-muted-foreground">
            {listing.about}
          </p>

          <div className="rule my-8" />

          <h2 className="eyebrow mb-4">Angebot</h2>
          <div className="flex flex-wrap gap-2">
            {listing.services.map((s) => (
              <span
                key={s}
                className="rounded-full border border-line bg-surface px-3.5 py-2 text-sm text-muted-foreground">
                {s}
              </span>
            ))}
          </div>

          <div className="mt-8 grid gap-4 sm:grid-cols-2">
            <div className="card-noir p-5">
              <p className="eyebrow mb-3 flex items-center gap-2">
                <Globe className="h-3.5 w-3.5" strokeWidth={1.8} /> Sprachen
              </p>
              <p className="text-sm text-muted-foreground">{listing.languages.join(" · ")}</p>
            </div>
            <div className="card-noir p-5">
              <p className="eyebrow mb-3 flex items-center gap-2">
                <CalendarClock className="h-3.5 w-3.5" strokeWidth={1.8} /> Erreichbarkeit
              </p>
              <p className="text-sm text-muted-foreground">{listing.availability}</p>
            </div>
            <div className="card-noir p-5">
              <p className="eyebrow mb-3">Treffpunkt</p>
              <p className="text-sm text-muted-foreground">
                {[listing.incall && "Empfang in eigenen Räumen", listing.outcall && "Besuche"]
                  .filter(Boolean)
                  .join(" · ") || "Nur digital"}
              </p>
            </div>
            <div className="card-noir p-5">
              <p className="eyebrow mb-3">Inserat</p>
              <p className="text-sm text-muted-foreground">
                {listing.id} · aktualisiert {relativeDay(listing.published)}
              </p>
            </div>
          </div>

          <div className="rule my-8" />

          <h2 className="eyebrow mb-4">Tarife</h2>
          <table className="w-full max-w-lg text-sm">
            <tbody className="divide-y divide-[color:var(--noira-line)]">
              {[
                { label: "30 Minuten", value: listing.rates.m30 },
                { label: "1 Stunde", value: listing.rates.h1 },
                { label: "2 Stunden", value: listing.rates.h2 },
                { label: "Übernachtung", value: listing.rates.night },
              ]
                .filter((r) => r.value !== undefined)
                .map((r) => (
                  <tr key={r.label}>
                    <td className="py-3 text-muted-foreground">{r.label}</td>
                    <td className="py-3 text-right font-medium text-foreground">
                      {r.value === null ? "auf Anfrage" : chf(r.value as number)}
                    </td>
                  </tr>
                ))}
            </tbody>
          </table>
          <p className="mt-4 max-w-lg text-xs leading-relaxed text-text-3">
            Preise werden von den Anbietenden selbst festgelegt und gelten für Zeit und Begleitung.
            NOIRA erhält davon keinen Anteil und ist an der Abrechnung nicht beteiligt.
          </p>

          {/* Sicherheitshinweis */}
          <div className="mt-10 flex gap-4 rounded-xl border border-line bg-surface/60 p-5">
            <ShieldAlert className="h-5 w-5 shrink-0 text-gold" strokeWidth={1.5} />
            <div className="text-sm leading-relaxed text-muted-foreground">
              <p className="mb-2 text-foreground">Sicher unterwegs</p>
              <p>
                Zahlen Sie niemals im Voraus per Link, Gutschein oder Krypto-Transfer an eine
                inserierende Person — seriöse Anbietende verlangen das nicht. Wirkt eine Situation
                unfrei oder erzwungen, brechen Sie ab und melden Sie das Inserat.
              </p>
            </div>
          </div>

          <button
            onClick={() => toast.success("Meldung erfasst — wir prüfen das Inserat innert einer Stunde.")}
            className="mt-5 flex items-center gap-2 text-xs text-muted-foreground underline underline-offset-4 transition hover:text-destructive">
            <Flag className="h-3.5 w-3.5" strokeWidth={1.6} /> Dieses Inserat melden
          </button>
        </div>

        {/* ---------- Kontaktkarte ---------- */}
        <aside>
          <div className="sticky top-24 space-y-4">
            <div className="card-noir p-6">
              <div className="mb-5 flex items-baseline justify-between">
                <span className="text-sm text-muted-foreground">ab</span>
                <span className="numeral text-3xl text-gold">
                  {chf(listing.rates.m30 ?? listing.rates.h1)}
                </span>
              </div>

              {listing.online && (
                <p className="mb-5 flex items-center gap-2 rounded-lg bg-verified/10 px-3 py-2 text-xs text-verified">
                  <span className="h-1.5 w-1.5 rounded-full bg-verified" />
                  Jetzt erreichbar
                </p>
              )}

              <button
                onClick={() => setPhoneShown(true)}
                className="mb-2.5 flex w-full items-center justify-center gap-2 rounded-lg bg-gold px-5 py-3.5 text-sm font-semibold text-ink transition hover:brightness-110">
                <Phone className="h-4 w-4" strokeWidth={2} />
                {phoneShown ? listing.phone : "Telefonnummer anzeigen"}
              </button>

              <button
                onClick={() => toast.success("Nachricht geöffnet — Anmeldung erforderlich.")}
                className="mb-4 flex w-full items-center justify-center gap-2 rounded-lg border border-line px-5 py-3.5 text-sm transition hover:border-gold/50">
                <MessageSquare className="h-4 w-4" strokeWidth={1.6} />
                Nachricht schreiben
              </button>

              <p className="text-center text-xs leading-relaxed text-text-3">
                Bitte erwähnen Sie beim Kontakt, dass Sie das Inserat auf NOIRA gesehen haben.
              </p>

              <div className="rule my-5" />

              <ul className="space-y-2.5 text-xs text-muted-foreground">
                <li className="flex items-center gap-2">
                  <BadgeCheck
                    className={cn("h-4 w-4", listing.verified ? "text-verified" : "text-text-3")}
                    strokeWidth={1.6}
                  />
                  {listing.verified
                    ? "Identität und Alter geprüft"
                    : "Noch nicht verifiziert"}
                </li>
                <li className="flex items-center gap-2">
                  <CalendarClock className="h-4 w-4" strokeWidth={1.6} />
                  Inserat aktiv seit {relativeDay(listing.published)}
                </li>
                <li className="flex items-center gap-2">
                  <MapPin className="h-4 w-4" strokeWidth={1.6} />
                  {listing.city}, {canton?.name}
                </li>
              </ul>
            </div>
          </div>
        </aside>
      </div>

      {/* ---------- Ähnliche ---------- */}
      {similar.length > 0 && (
        <section className="mt-20">
          <div className="rule mb-10" />
          <p className="eyebrow mb-3">Ebenfalls interessant</p>
          <h2 className="display mb-8 text-3xl">Ähnliche Inserate</h2>
          <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
            {similar.map((l) => (
              <ListingCard key={l.id} listing={l} />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
