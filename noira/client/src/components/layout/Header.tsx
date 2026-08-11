/* ============================================================
   Header — Sticky-Navigation
   Desktop: Hauptnavigation mit Kategorien-Flyout.
   Mobil: Vollflächiges Menü, Suche immer eine Berührung entfernt.
   ============================================================ */

import { Wordmark } from "@/components/Wordmark";
import { CATEGORIES, SITE_LOCALES } from "@/data/taxonomy";
import { cn } from "@/lib/utils";
import { ChevronDown, Globe, Menu, Search, UserRound, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { Link, useLocation } from "wouter";

const NAV = [
  { href: "/inserate", label: "Inserate" },
  { href: "/clubs", label: "Clubs & Studios" },
  { href: "/werben", label: "Inserieren" },
  { href: "/sicherheit", label: "Sicherheit" },
];

export function Header() {
  const [location, navigate] = useLocation();
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [catOpen, setCatOpen] = useState(false);
  const [localeOpen, setLocaleOpen] = useState(false);
  const [query, setQuery] = useState("");
  const catRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 12);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // Navigation schliesst alle Overlays — sonst bleibt das Flyout beim
  // Seitenwechsel offen stehen.
  useEffect(() => {
    setMenuOpen(false);
    setCatOpen(false);
    setLocaleOpen(false);
  }, [location]);

  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      if (catRef.current && !catRef.current.contains(e.target as Node)) setCatOpen(false);
    };
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, []);

  const submitSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const q = query.trim();
    navigate(q ? `/inserate?q=${encodeURIComponent(q)}` : "/inserate");
    setMenuOpen(false);
  };

  return (
    <>
      <header
        className={cn(
          "sticky top-0 z-50 transition-all duration-300",
          scrolled
            ? "border-b border-line bg-ink/85 backdrop-blur-xl"
            : "border-b border-transparent bg-transparent",
        )}>
        <div className="container-noira flex h-18 items-center gap-6">
          <Link href="/" aria-label="NOIRA Startseite">
            <Wordmark className="h-6" />
          </Link>

          <nav className="hidden items-center gap-1 lg:flex">
            <div ref={catRef} className="relative">
              <button
                onClick={() => setCatOpen((v) => !v)}
                aria-expanded={catOpen}
                className="flex items-center gap-1.5 rounded-md px-3 py-2 text-sm text-muted-foreground transition hover:text-foreground">
                Kategorien
                <ChevronDown
                  className={cn("h-3.5 w-3.5 transition", catOpen && "rotate-180")}
                  strokeWidth={1.6}
                />
              </button>
              {catOpen && (
                <div className="absolute top-full left-0 mt-2 w-[34rem] rounded-xl border border-line bg-popover p-2 shadow-2xl shadow-black/60">
                  <div className="grid grid-cols-2 gap-1">
                    {CATEGORIES.map((c) => (
                      <Link
                        key={c.id}
                        href={`/inserate?kategorie=${c.id}`}
                        className="group flex items-start gap-3 rounded-lg px-3 py-2.5 transition hover:bg-surface-2">
                        <span className="mt-0.5 text-lg text-gold-soft transition group-hover:text-gold">
                          {c.glyph}
                        </span>
                        <span>
                          <span className="block text-sm text-foreground">{c.label}</span>
                          <span className="block text-xs text-muted-foreground">
                            {c.description}
                          </span>
                        </span>
                      </Link>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {NAV.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "rounded-md px-3 py-2 text-sm transition",
                  location.startsWith(item.href)
                    ? "text-foreground"
                    : "text-muted-foreground hover:text-foreground",
                )}>
                {item.label}
              </Link>
            ))}
          </nav>

          <form onSubmit={submitSearch} className="ml-auto hidden max-w-56 flex-1 md:block">
            <label className="relative block">
              <Search
                className="pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-muted-foreground"
                strokeWidth={1.6}
              />
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                type="search"
                placeholder="Suchen …"
                aria-label="Inserate durchsuchen"
                className="w-full rounded-full border border-line bg-surface/70 py-2 pr-4 pl-9 text-sm placeholder:text-muted-foreground/70 focus:border-gold/60 focus:outline-none"
              />
            </label>
          </form>

          <div className="ml-auto flex items-center gap-2 md:ml-0">
            <div className="relative hidden sm:block">
              <button
                onClick={() => setLocaleOpen((v) => !v)}
                className="flex items-center gap-1.5 rounded-md px-2.5 py-2 text-sm text-muted-foreground transition hover:text-foreground"
                aria-label="Sprache wählen">
                <Globe className="h-4 w-4" strokeWidth={1.6} />
                DE
              </button>
              {localeOpen && (
                <div className="absolute top-full right-0 mt-2 w-36 rounded-lg border border-line bg-popover p-1 shadow-xl">
                  {SITE_LOCALES.map((l) => (
                    <button
                      key={l.code}
                      onClick={() => setLocaleOpen(false)}
                      className={cn(
                        "block w-full rounded-md px-3 py-2 text-left text-sm transition hover:bg-surface-2",
                        l.code === "de" ? "text-gold" : "text-muted-foreground",
                      )}>
                      {l.name}
                    </button>
                  ))}
                </div>
              )}
            </div>

            <Link
              href="/login"
              className="hidden items-center gap-1.5 rounded-md px-2.5 py-2 text-sm text-muted-foreground transition hover:text-foreground sm:flex">
              <UserRound className="h-4 w-4" strokeWidth={1.6} />
              Anmelden
            </Link>

            <Link
              href="/werben"
              className="hidden rounded-full bg-gold px-4 py-2.5 text-sm font-semibold text-ink transition hover:brightness-110 md:block">
              Inserat aufgeben
            </Link>

            <button
              onClick={() => setMenuOpen(true)}
              className="rounded-md p-2 text-foreground lg:hidden"
              aria-label="Menü öffnen">
              <Menu className="h-5 w-5" strokeWidth={1.6} />
            </button>
          </div>
        </div>
      </header>

      {/* --- Mobiles Menü ------------------------------------------------ */}
      {menuOpen && (
        <div className="fixed inset-0 z-60 flex flex-col bg-ink lg:hidden">
          <div className="container-noira flex h-18 shrink-0 items-center justify-between">
            <Wordmark className="h-6" />
            <button
              onClick={() => setMenuOpen(false)}
              className="rounded-md p-2"
              aria-label="Menü schliessen">
              <X className="h-5 w-5" strokeWidth={1.6} />
            </button>
          </div>

          <div className="container-noira flex-1 overflow-y-auto pb-10">
            <form onSubmit={submitSearch} className="mb-8">
              <label className="relative block">
                <Search
                  className="pointer-events-none absolute top-1/2 left-4 h-4 w-4 -translate-y-1/2 text-muted-foreground"
                  strokeWidth={1.6}
                />
                <input
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  type="search"
                  placeholder="Name, Stadt, Service …"
                  className="w-full rounded-full border border-line bg-surface py-3.5 pr-4 pl-11 text-sm focus:border-gold/60 focus:outline-none"
                />
              </label>
            </form>

            <p className="eyebrow mb-3">Navigation</p>
            <div className="mb-8 flex flex-col">
              {NAV.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className="border-b border-line py-3.5 text-lg text-foreground">
                  {item.label}
                </Link>
              ))}
              <Link href="/login" className="border-b border-line py-3.5 text-lg text-foreground">
                Anmelden
              </Link>
            </div>

            <p className="eyebrow mb-3">Kategorien</p>
            <div className="mb-8 grid grid-cols-2 gap-2">
              {CATEGORIES.map((c) => (
                <Link
                  key={c.id}
                  href={`/inserate?kategorie=${c.id}`}
                  className="rounded-lg border border-line bg-surface px-3 py-3 text-sm">
                  <span className="mr-2 text-gold-soft">{c.glyph}</span>
                  {c.short}
                </Link>
              ))}
            </div>

            <Link
              href="/werben"
              className="block rounded-full bg-gold px-6 py-3.5 text-center text-sm font-semibold text-ink">
              Inserat aufgeben
            </Link>
          </div>
        </div>
      )}
    </>
  );
}

export default Header;
