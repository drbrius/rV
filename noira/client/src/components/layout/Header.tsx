/* ============================================================
   Header — Sticky-Navigation
   Desktop: Hauptnavigation mit Kategorien-Flyout.
   Mobil: Vollflächiges Menü, Suche immer eine Berührung entfernt.
   ============================================================ */

import { Phase } from "@/components/Phase";
import { Wordmark } from "@/components/Wordmark";
import { CATEGORIES } from "@/data/taxonomy";
import { useSavedIds } from "@/hooks/useSaved";
import { LOCALES, LOCALE_NAMES, setLocale, useI18n } from "@/lib/i18n";
import { cn } from "@/lib/utils";
import { ChevronDown, Globe, Heart, Menu, Search, UserRound, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { Link, useLocation } from "wouter";

const NAV = [
  { href: "/inserate", key: "nav.listings" },
  { href: "/clubs", key: "nav.clubs" },
  { href: "/werben", key: "nav.advertise" },
  { href: "/sicherheit", key: "nav.safety" },
];

export function Header() {
  const [location, navigate] = useLocation();
  const [scrolled, setScrolled] = useState(false);
  const [progress, setProgress] = useState(0);
  const [menuOpen, setMenuOpen] = useState(false);
  const [catOpen, setCatOpen] = useState(false);
  const [localeOpen, setLocaleOpen] = useState(false);
  const [query, setQuery] = useState("");
  const saved = useSavedIds();
  const { t, locale } = useI18n();
  const catRef = useRef<HTMLDivElement>(null);

  // Der Lesefortschritt läuft als Lichtsaum unter der Navigation mit —
  // die Sichel des Zeichens, in die Breite gezogen.
  useEffect(() => {
    const onScroll = () => {
      setScrolled(window.scrollY > 12);
      const reach = document.documentElement.scrollHeight - window.innerHeight;
      setProgress(reach > 0 ? Math.min(1, window.scrollY / reach) : 0);
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
    };
  }, [location]);

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
          <Link href="/" aria-label={t("nav.home")}>
            <Wordmark className="text-[0.85rem]" />
          </Link>

          <nav className="hidden items-center gap-1 lg:flex">
            <div ref={catRef} className="relative">
              <button
                onClick={() => setCatOpen((v) => !v)}
                aria-expanded={catOpen}
                className="flex items-center gap-1.5 rounded-md px-3 py-2 text-sm text-muted-foreground transition hover:text-foreground">
                {t("nav.categories")}
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
                        <Phase
                          phase={c.phase}
                          className="mt-0.5 h-5 w-5 text-gold-soft transition group-hover:text-gold"
                        />
                        <span>
                          <span className="block text-sm text-foreground">{t(`cat.${c.id}.label`)}</span>
                          <span className="block text-xs text-muted-foreground">
                            {t(`cat.${c.id}.desc`)}
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
                {t(item.key)}
              </Link>
            ))}
          </nav>

          <form onSubmit={submitSearch} className="ml-auto hidden max-w-64 flex-1 md:block">
            <label className="relative block">
              <Search
                className="pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-muted-foreground"
                strokeWidth={1.6}
              />
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                type="search"
                placeholder={t("nav.search")}
                aria-label={t("nav.searchAria")}
                className="w-full rounded-full border border-line bg-surface/70 py-2 pr-4 pl-9 text-sm placeholder:text-muted-foreground/70 focus:border-gold/60 focus:outline-none"
              />
            </label>
          </form>

          <div className="ml-auto flex items-center gap-2 md:ml-0">
            <div className="relative hidden sm:block">
              <button
                onClick={() => setLocaleOpen((v) => !v)}
                className="flex items-center gap-1.5 rounded-md px-2.5 py-2 text-sm text-muted-foreground transition hover:text-foreground"
                aria-label={t("nav.language")}>
                <Globe className="h-4 w-4" strokeWidth={1.6} />
                {locale.toUpperCase()}
              </button>
              {localeOpen && (
                <div className="absolute top-full right-0 mt-2 w-36 rounded-lg border border-line bg-popover p-1 shadow-xl">
                  {LOCALES.map((code) => (
                    <button
                      key={code}
                      onClick={() => {
                        setLocale(code);
                        setLocaleOpen(false);
                      }}
                      aria-current={code === locale}
                      className={cn(
                        "block w-full rounded-md px-3 py-2 text-left text-sm transition hover:bg-surface-2",
                        code === locale ? "text-gold" : "text-muted-foreground",
                      )}>
                      {LOCALE_NAMES[code]}
                    </button>
                  ))}
                </div>
              )}
            </div>

            <Link
              href="/merkliste"
              aria-label={t("nav.savedAria", { n: saved.length })}
              className="relative rounded-md p-2 text-muted-foreground transition hover:text-foreground">
              <Heart
                className={cn("h-4 w-4", saved.length > 0 && "fill-current text-orchid")}
                strokeWidth={1.6}
              />
              {saved.length > 0 && (
                <span className="absolute -top-1 -right-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-orchid px-1 font-mono text-[0.5625rem] font-semibold text-white">
                  {saved.length}
                </span>
              )}
            </Link>

            <Link
              href="/login"
              className="hidden items-center gap-1.5 rounded-md px-2.5 py-2 text-sm text-muted-foreground transition hover:text-foreground sm:flex">
              <UserRound className="h-4 w-4" strokeWidth={1.6} />
              {t("nav.login")}
            </Link>

            <Link
              href="/werben"
              className="hidden rounded-full bg-gold px-4 py-2.5 text-sm font-semibold text-ink transition hover:brightness-110 md:block">
              {t("nav.postAd")}
            </Link>

            <button
              onClick={() => setMenuOpen(true)}
              className="rounded-md p-2 text-foreground lg:hidden"
              aria-label={t("nav.menuOpen")}>
              <Menu className="h-5 w-5" strokeWidth={1.6} />
            </button>
          </div>
        </div>

        <div
          aria-hidden
          className="absolute inset-x-0 bottom-0 h-px origin-left transition-opacity duration-300"
          style={{
            transform: `scaleX(${progress})`,
            opacity: scrolled ? 1 : 0,
            background:
              "linear-gradient(to right, transparent, var(--noira-gold-soft) 30%, var(--noira-corona))",
          }}
        />
      </header>

      {/* --- Mobiles Menü ------------------------------------------------ */}
      {menuOpen && (
        <div className="fixed inset-0 z-60 flex flex-col bg-ink lg:hidden">
          <div className="container-noira flex h-18 shrink-0 items-center justify-between">
            <Wordmark className="text-[0.85rem]" />
            <button
              onClick={() => setMenuOpen(false)}
              className="rounded-md p-2"
              aria-label={t("nav.menuClose")}>
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
                  placeholder={t("nav.searchLong")}
                  className="w-full rounded-full border border-line bg-surface py-3.5 pr-4 pl-11 text-sm focus:border-gold/60 focus:outline-none"
                />
              </label>
            </form>

            <p className="eyebrow mb-3">{t("nav.navigation")}</p>
            <div className="mb-8 flex flex-col">
              {NAV.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className="border-b border-line py-3.5 text-lg text-foreground">
                  {t(item.key)}
                </Link>
              ))}
              <Link
                href="/merkliste"
                className="flex items-center justify-between border-b border-line py-3.5 text-lg text-foreground">
                {t("nav.saved")}
                {saved.length > 0 && (
                  <span className="rounded-full bg-orchid px-2 py-0.5 font-mono text-xs text-white">
                    {saved.length}
                  </span>
                )}
              </Link>
              <Link href="/login" className="border-b border-line py-3.5 text-lg text-foreground">
                {t("nav.login")}
              </Link>
            </div>

            <p className="eyebrow mb-3">{t("nav.categories")}</p>
            <div className="mb-8 grid grid-cols-2 gap-2">
              {CATEGORIES.map((c) => (
                <Link
                  key={c.id}
                  href={`/inserate?kategorie=${c.id}`}
                  className="flex items-center gap-2.5 rounded-lg border border-line bg-surface px-3 py-3 text-sm">
                  <Phase phase={c.phase} className="h-4 w-4 text-gold-soft" />
                  {t(`cat.${c.id}.short`)}
                </Link>
              ))}
            </div>

            <Link
              href="/werben"
              className="block rounded-full bg-gold px-6 py-3.5 text-center text-sm font-semibold text-ink">
              {t("nav.postAd")}
            </Link>
          </div>
        </div>
      )}
    </>
  );
}

export default Header;
