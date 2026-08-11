/* ============================================================
   Trefferliste
   Der Filterzustand lebt vollständig in der URL: jeder Filter
   ist damit teilbar, zurück-navigierbar und indexierbar.
   ============================================================ */

import { ListingCard } from "@/components/ListingCard";
import { LISTINGS, type Listing } from "@/data/listings";
import { CANTONS, CATEGORIES, LANGUAGES, SERVICES } from "@/data/taxonomy";
import { chf } from "@/lib/format";
import { cn } from "@/lib/utils";
import { ChevronDown, SlidersHorizontal, X } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { useLocation, useSearch } from "wouter";

type Sort = "relevanz" | "neu" | "preis-auf" | "preis-ab" | "premium";

const SORTS: { id: Sort; label: string }[] = [
  { id: "relevanz", label: "Empfohlen" },
  { id: "neu", label: "Neueste zuerst" },
  { id: "preis-auf", label: "Preis aufsteigend" },
  { id: "preis-ab", label: "Preis absteigend" },
  { id: "premium", label: "Nur Premium" },
];

const PRICE_MAX = 600;

type Filters = {
  q: string;
  kanton: string;
  kategorie: string;
  services: string[];
  sprachen: string[];
  verified: boolean;
  video: boolean;
  online: boolean;
  incall: boolean;
  outcall: boolean;
  preis: number;
  sortierung: Sort;
};

function parse(search: string): Filters {
  const p = new URLSearchParams(search);
  const list = (key: string) => (p.get(key) ? p.get(key)!.split(",").filter(Boolean) : []);
  return {
    q: p.get("q") ?? "",
    kanton: p.get("kanton") ?? "",
    kategorie: p.get("kategorie") ?? "",
    services: list("services"),
    sprachen: list("sprachen"),
    verified: p.get("verifiziert") === "1",
    video: p.get("video") === "1",
    online: p.get("online") === "1",
    incall: p.get("empfang") === "1",
    outcall: p.get("besuch") === "1",
    preis: Number(p.get("preis")) || PRICE_MAX,
    sortierung: (p.get("sortierung") as Sort) ?? "relevanz",
  };
}

function serialize(f: Filters) {
  const p = new URLSearchParams();
  if (f.q) p.set("q", f.q);
  if (f.kanton) p.set("kanton", f.kanton);
  if (f.kategorie) p.set("kategorie", f.kategorie);
  if (f.services.length) p.set("services", f.services.join(","));
  if (f.sprachen.length) p.set("sprachen", f.sprachen.join(","));
  if (f.verified) p.set("verifiziert", "1");
  if (f.video) p.set("video", "1");
  if (f.online) p.set("online", "1");
  if (f.incall) p.set("empfang", "1");
  if (f.outcall) p.set("besuch", "1");
  if (f.preis < PRICE_MAX) p.set("preis", String(f.preis));
  if (f.sortierung !== "relevanz") p.set("sortierung", f.sortierung);
  const s = p.toString();
  return s ? `?${s}` : "";
}

function matches(l: Listing, f: Filters) {
  if (f.kanton && l.canton !== f.kanton) return false;
  if (f.kategorie && l.category !== f.kategorie) return false;
  if (f.verified && !l.verified) return false;
  if (f.video && !l.hasVideo) return false;
  if (f.online && !l.online) return false;
  if (f.incall && !l.incall) return false;
  if (f.outcall && !l.outcall) return false;
  if (f.preis < PRICE_MAX && l.rates.h1 > f.preis) return false;
  if (f.services.length && !f.services.every((s) => l.services.includes(s as never))) return false;
  if (f.sprachen.length && !f.sprachen.some((s) => l.languages.includes(s as never))) return false;
  if (f.q) {
    const hay =
      `${l.name} ${l.city} ${l.canton} ${l.tagline} ${l.about} ${l.services.join(" ")} ${l.languages.join(" ")}`.toLowerCase();
    if (!f.q.toLowerCase().split(/\s+/).every((t) => hay.includes(t))) return false;
  }
  return true;
}

function sortListings(list: Listing[], sort: Sort) {
  const arr = [...list];
  switch (sort) {
    case "neu":
      return arr.sort((a, b) => b.published.localeCompare(a.published));
    case "preis-auf":
      return arr.sort((a, b) => a.rates.h1 - b.rates.h1);
    case "preis-ab":
      return arr.sort((a, b) => b.rates.h1 - a.rates.h1);
    case "premium":
      return arr.filter((l) => l.premium).sort((a, b) => b.views - a.views);
    default:
      // Empfohlen: bezahlte Platzierung zuerst, dann Verifizierung, dann Aktualität
      return arr.sort(
        (a, b) =>
          Number(b.premium) - Number(a.premium) ||
          Number(b.verified) - Number(a.verified) ||
          b.published.localeCompare(a.published),
      );
  }
}

function Toggle({
  checked,
  onChange,
  label,
  count,
}: {
  checked: boolean;
  onChange: (v: boolean) => void;
  label: string;
  count?: number;
}) {
  return (
    <label className="flex cursor-pointer items-center gap-2.5 py-1.5 text-sm">
      <span
        className={cn(
          "flex h-4 w-4 shrink-0 items-center justify-center rounded border transition",
          checked ? "border-gold bg-gold" : "border-line bg-surface-2",
        )}>
        {checked && (
          <svg viewBox="0 0 12 12" className="h-2.5 w-2.5 text-ink" aria-hidden="true">
            <path
              d="M2 6.2 4.6 8.8 10 3.4"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        )}
      </span>
      <input
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        className="sr-only"
      />
      <span className={cn("flex-1", checked ? "text-foreground" : "text-muted-foreground")}>
        {label}
      </span>
      {count !== undefined && (
        <span className="font-mono text-xs text-muted-foreground/60">{count}</span>
      )}
    </label>
  );
}

function FilterGroup({
  title,
  children,
  defaultOpen = true,
}: {
  title: string;
  children: React.ReactNode;
  defaultOpen?: boolean;
}) {
  return (
    <details open={defaultOpen} className="group border-b border-line py-4">
      <summary className="flex cursor-pointer list-none items-center justify-between text-sm font-medium text-foreground">
        {title}
        <ChevronDown
          className="h-4 w-4 text-muted-foreground transition group-open:rotate-180"
          strokeWidth={1.6}
        />
      </summary>
      <div className="mt-3">{children}</div>
    </details>
  );
}

function FilterPanel({
  filters,
  set,
}: {
  filters: Filters;
  set: (patch: Partial<Filters>) => void;
}) {
  const toggleIn = (key: "services" | "sprachen", value: string) => {
    const cur = filters[key];
    set({ [key]: cur.includes(value) ? cur.filter((v) => v !== value) : [...cur, value] } as never);
  };

  return (
    <div>
      <FilterGroup title="Region">
        <div className="relative">
          <select
            value={filters.kanton}
            onChange={(e) => set({ kanton: e.target.value })}
            className="w-full appearance-none rounded-lg border border-line bg-surface-2 px-3 py-2.5 pr-9 text-sm focus:border-gold/60 focus:outline-none">
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
      </FilterGroup>

      <FilterGroup title="Kategorie">
        <div className="space-y-0.5">
          <Toggle
            checked={filters.kategorie === ""}
            onChange={() => set({ kategorie: "" })}
            label="Alle Kategorien"
          />
          {CATEGORIES.map((c) => (
            <Toggle
              key={c.id}
              checked={filters.kategorie === c.id}
              onChange={(v) => set({ kategorie: v ? c.id : "" })}
              label={c.short}
              count={LISTINGS.filter((l) => l.category === c.id).length}
            />
          ))}
        </div>
      </FilterGroup>

      <FilterGroup title="Preis pro Stunde">
        <input
          type="range"
          min={100}
          max={PRICE_MAX}
          step={20}
          value={filters.preis}
          onChange={(e) => set({ preis: Number(e.target.value) })}
          className="w-full accent-[color:var(--noira-gold)]"
          aria-label="Höchstpreis pro Stunde"
        />
        <p className="mt-2 text-xs text-muted-foreground">
          bis{" "}
          <span className="text-foreground">
            {filters.preis >= PRICE_MAX ? "beliebig" : chf(filters.preis)}
          </span>
        </p>
      </FilterGroup>

      <FilterGroup title="Merkmale">
        <Toggle
          checked={filters.verified}
          onChange={(v) => set({ verified: v })}
          label="Nur verifiziert"
        />
        <Toggle checked={filters.online} onChange={(v) => set({ online: v })} label="Jetzt erreichbar" />
        <Toggle checked={filters.video} onChange={(v) => set({ video: v })} label="Mit Video" />
        <Toggle
          checked={filters.incall}
          onChange={(v) => set({ incall: v })}
          label="Empfang in eigenen Räumen"
        />
        <Toggle checked={filters.outcall} onChange={(v) => set({ outcall: v })} label="Besucht mich" />
      </FilterGroup>

      <FilterGroup title="Services" defaultOpen={false}>
        <div className="max-h-64 space-y-0.5 overflow-y-auto pr-1">
          {SERVICES.map((s) => (
            <Toggle
              key={s}
              checked={filters.services.includes(s)}
              onChange={() => toggleIn("services", s)}
              label={s}
            />
          ))}
        </div>
      </FilterGroup>

      <FilterGroup title="Sprachen" defaultOpen={false}>
        <div className="max-h-64 space-y-0.5 overflow-y-auto pr-1">
          {LANGUAGES.map((s) => (
            <Toggle
              key={s}
              checked={filters.sprachen.includes(s)}
              onChange={() => toggleIn("sprachen", s)}
              label={s}
            />
          ))}
        </div>
      </FilterGroup>
    </div>
  );
}

export default function Listings() {
  const search = useSearch();
  const [, navigate] = useLocation();
  const filters = useMemo(() => parse(search), [search]);
  const [sheetOpen, setSheetOpen] = useState(false);

  useEffect(() => {
    document.body.style.overflow = sheetOpen ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [sheetOpen]);

  const set = (patch: Partial<Filters>) =>
    navigate(`/inserate${serialize({ ...filters, ...patch })}`, { replace: true });

  const results = useMemo(
    () => sortListings(LISTINGS.filter((l) => matches(l, filters)), filters.sortierung),
    [filters],
  );

  const activeChips: { label: string; clear: Partial<Filters> }[] = [
    ...(filters.q ? [{ label: `„${filters.q}“`, clear: { q: "" } }] : []),
    ...(filters.kanton
      ? [
          {
            label: CANTONS.find((c) => c.code === filters.kanton)?.name ?? filters.kanton,
            clear: { kanton: "" },
          },
        ]
      : []),
    ...(filters.kategorie
      ? [
          {
            label: CATEGORIES.find((c) => c.id === filters.kategorie)?.short ?? filters.kategorie,
            clear: { kategorie: "" },
          },
        ]
      : []),
    ...(filters.verified ? [{ label: "Verifiziert", clear: { verified: false } }] : []),
    ...(filters.online ? [{ label: "Jetzt erreichbar", clear: { online: false } }] : []),
    ...(filters.video ? [{ label: "Mit Video", clear: { video: false } }] : []),
    ...(filters.incall ? [{ label: "Empfang", clear: { incall: false } }] : []),
    ...(filters.outcall ? [{ label: "Besucht mich", clear: { outcall: false } }] : []),
    ...(filters.preis < PRICE_MAX
      ? [{ label: `bis ${chf(filters.preis)}`, clear: { preis: PRICE_MAX } }]
      : []),
    ...filters.services.map((s) => ({
      label: s,
      clear: { services: filters.services.filter((x) => x !== s) },
    })),
    ...filters.sprachen.map((s) => ({
      label: s,
      clear: { sprachen: filters.sprachen.filter((x) => x !== s) },
    })),
  ];

  return (
    <div className="container-noira py-10">
      <p className="eyebrow mb-3">Inserate</p>
      <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
        <h1 className="display text-4xl sm:text-5xl">
          {results.length}{" "}
          <span className="text-muted-foreground">
            {results.length === 1 ? "Treffer" : "Treffer"}
          </span>
        </h1>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setSheetOpen(true)}
            className="flex items-center gap-2 rounded-full border border-line px-4 py-2.5 text-sm lg:hidden">
            <SlidersHorizontal className="h-4 w-4" strokeWidth={1.6} />
            Filter
            {activeChips.length > 0 && (
              <span className="rounded-full bg-gold px-1.5 text-xs font-semibold text-ink">
                {activeChips.length}
              </span>
            )}
          </button>

          <div className="relative">
            <select
              value={filters.sortierung}
              onChange={(e) => set({ sortierung: e.target.value as Sort })}
              aria-label="Sortierung"
              className="appearance-none rounded-full border border-line bg-transparent py-2.5 pr-9 pl-4 text-sm focus:border-gold/60 focus:outline-none">
              {SORTS.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.label}
                </option>
              ))}
            </select>
            <ChevronDown
              className="pointer-events-none absolute top-1/2 right-3 h-4 w-4 -translate-y-1/2 text-muted-foreground"
              strokeWidth={1.6}
            />
          </div>
        </div>
      </div>

      {activeChips.length > 0 && (
        <div className="mb-6 flex flex-wrap items-center gap-2">
          {activeChips.map((chip) => (
            <button
              key={chip.label}
              onClick={() => set(chip.clear)}
              className="flex items-center gap-1.5 rounded-full border border-gold/40 bg-gold/10 px-3 py-1.5 text-xs text-foreground transition hover:bg-gold/20">
              {chip.label}
              <X className="h-3 w-3" strokeWidth={2} />
            </button>
          ))}
          <button
            onClick={() => navigate("/inserate", { replace: true })}
            className="px-2 text-xs text-muted-foreground underline underline-offset-2 hover:text-foreground">
            alle zurücksetzen
          </button>
        </div>
      )}

      <div className="grid gap-8 lg:grid-cols-[16rem_1fr]">
        <aside className="hidden lg:block">
          <div className="sticky top-24">
            <FilterPanel filters={filters} set={set} />
          </div>
        </aside>

        <div>
          {results.length === 0 ? (
            <div className="card-noir flex flex-col items-center px-6 py-20 text-center">
              <p className="display mb-3 text-3xl">Keine Treffer</p>
              <p className="mb-6 max-w-sm text-sm text-muted-foreground">
                Mit dieser Kombination finden wir gerade nichts. Weniger Filter, mehr Auswahl —
                oder eine Suche in einer Nachbarregion.
              </p>
              <button
                onClick={() => navigate("/inserate", { replace: true })}
                className="rounded-full bg-gold px-6 py-3 text-sm font-semibold text-ink">
                Filter zurücksetzen
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-2 xl:grid-cols-3">
              {results.map((l) => (
                <ListingCard key={l.id} listing={l} />
              ))}
            </div>
          )}

          <p className="mt-10 text-center text-xs text-muted-foreground/70">
            Alle Inserate werden von den Anbietenden selbst erstellt. NOIRA vermittelt keine
            Dienstleistungen und ist an Absprachen nicht beteiligt.
          </p>
        </div>
      </div>

      {/* Mobiles Filter-Panel */}
      {sheetOpen && (
        <div className="fixed inset-0 z-60 flex flex-col bg-ink lg:hidden">
          <div className="flex h-16 shrink-0 items-center justify-between border-b border-line px-5">
            <span className="text-sm font-medium">Filter</span>
            <button onClick={() => setSheetOpen(false)} aria-label="Filter schliessen">
              <X className="h-5 w-5" strokeWidth={1.6} />
            </button>
          </div>
          <div className="flex-1 overflow-y-auto px-5">
            <FilterPanel filters={filters} set={set} />
          </div>
          <div className="shrink-0 border-t border-line p-5">
            <button
              onClick={() => setSheetOpen(false)}
              className="w-full rounded-full bg-gold py-3.5 text-sm font-semibold text-ink">
              {results.length} Treffer anzeigen
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
