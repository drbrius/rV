/* ============================================================
   Footer — Orientierung, Rechtliches, Vertrauen
   Enthält bewusst prominent die Meldestelle: eine Plattform in
   diesem Bereich muss den Weg zu Hilfe kürzer machen als den
   zum nächsten Inserat.
   ============================================================ */

import { Wordmark } from "@/components/Wordmark";
import { CANTONS, CATEGORIES } from "@/data/taxonomy";
import { Bitcoin, CreditCard, ShieldCheck } from "lucide-react";
import { Link } from "wouter";

const TOP_CANTONS = ["ZH", "BE", "BS", "GE", "VD", "LU", "AG", "SG", "TI", "ZG"];

export function Footer() {
  return (
    <footer className="mt-24 border-t border-line bg-[oklch(0.095_0.008_295)]">
      <div className="container-noira py-14">
        <div className="grid gap-10 md:grid-cols-2 lg:grid-cols-5">
          <div className="lg:col-span-2">
            <Wordmark className="mb-5 text-[0.9rem]" showDomain />
            <p className="max-w-sm text-sm leading-relaxed text-muted-foreground">
              NOIRA ist eine Schweizer Inserateplattform für erotische Dienstleistungen. Wir
              vermitteln nicht, wir stellen die Bühne: Anbietende inserieren selbstständig,
              bestimmen ihre Preise selbst und behalten die volle Kontrolle über ihr Profil.
            </p>

            <div className="mt-6 flex flex-wrap items-center gap-2">
              <span className="flex items-center gap-1.5 rounded-full border border-line px-3 py-1.5 text-xs text-muted-foreground">
                <CreditCard className="h-3.5 w-3.5" strokeWidth={1.6} /> Visa · Mastercard · Amex
              </span>
              <span className="flex items-center gap-1.5 rounded-full border border-line px-3 py-1.5 text-xs text-muted-foreground">
                TWINT
              </span>
              <span className="flex items-center gap-1.5 rounded-full border border-line px-3 py-1.5 text-xs text-muted-foreground">
                <Bitcoin className="h-3.5 w-3.5" strokeWidth={1.6} /> BTC · ETH · USDT
              </span>
            </div>
          </div>

          <div>
            <p className="eyebrow mb-4">Entdecken</p>
            <ul className="space-y-2.5 text-sm">
              {CATEGORIES.slice(0, 6).map((c) => (
                <li key={c.id}>
                  <Link
                    href={`/inserate?kategorie=${c.id}`}
                    className="text-muted-foreground transition hover:text-foreground">
                    {c.short}
                  </Link>
                </li>
              ))}
              <li>
                <Link
                  href="/inserate"
                  className="text-muted-foreground transition hover:text-foreground">
                  Alle Inserate
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <p className="eyebrow mb-4">Regionen</p>
            <ul className="space-y-2.5 text-sm">
              {TOP_CANTONS.slice(0, 7).map((code) => {
                const canton = CANTONS.find((c) => c.code === code);
                return (
                  <li key={code}>
                    <Link
                      href={`/inserate?kanton=${code}`}
                      className="text-muted-foreground transition hover:text-foreground">
                      {canton?.name}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>

          <div>
            <p className="eyebrow mb-4">Plattform</p>
            <ul className="space-y-2.5 text-sm">
              <li>
                <Link
                  href="/werben"
                  className="text-muted-foreground transition hover:text-foreground">
                  Inserat aufgeben
                </Link>
              </li>
              <li>
                <Link
                  href="/werben#preise"
                  className="text-muted-foreground transition hover:text-foreground">
                  Preise
                </Link>
              </li>
              <li>
                <Link
                  href="/sicherheit"
                  className="text-muted-foreground transition hover:text-foreground">
                  Sicherheit & Meldestelle
                </Link>
              </li>
              <li>
                <Link
                  href="/agb"
                  className="text-muted-foreground transition hover:text-foreground">
                  AGB
                </Link>
              </li>
              <li>
                <Link
                  href="/datenschutz"
                  className="text-muted-foreground transition hover:text-foreground">
                  Datenschutz
                </Link>
              </li>
              <li>
                <Link
                  href="/impressum"
                  className="text-muted-foreground transition hover:text-foreground">
                  Impressum
                </Link>
              </li>
            </ul>
          </div>
        </div>

        {/* Meldestelle — bewusst als eigener, auffälliger Block */}
        <div className="mt-12 flex flex-col gap-4 rounded-xl border border-line bg-surface/60 p-5 sm:flex-row sm:items-center">
          <ShieldCheck className="h-6 w-6 shrink-0 text-verified" strokeWidth={1.5} />
          <p className="flex-1 text-sm leading-relaxed text-muted-foreground">
            <span className="text-foreground">Verdacht auf Zwang, Menschenhandel oder
            Minderjährige?</span>{" "}
            Melden Sie es sofort — anonym und rund um die Uhr. Notruf Polizei 117, Beratung für
            Betroffene bei der Fachstelle ACT212 unter 0840 212 212.
          </p>
          <Link
            href="/sicherheit"
            className="shrink-0 rounded-full border border-verified/50 px-4 py-2 text-sm text-verified transition hover:bg-verified/10">
            Meldung erfassen
          </Link>
        </div>

        <div className="rule my-10" />

        <div className="flex flex-col gap-4 text-xs text-muted-foreground/80 sm:flex-row sm:items-center sm:justify-between">
          <p>© {new Date().getFullYear()} NOIRA — Ein Angebot der Noira Media GmbH, Zürich.</p>
          <p className="flex items-center gap-3">
            <span className="rounded border border-destructive/50 px-2 py-0.5 font-mono text-destructive">
              18+
            </span>
            <span>Inhalte nur für Erwachsene · RTA-gekennzeichnet</span>
          </p>
        </div>
      </div>
    </footer>
  );
}

export default Footer;
