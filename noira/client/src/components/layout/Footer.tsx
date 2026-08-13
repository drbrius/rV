/* ============================================================
   Footer — Orientierung, Rechtliches, Vertrauen
   Enthält bewusst prominent die Meldestelle: eine Plattform in
   diesem Bereich muss den Weg zu Hilfe kürzer machen als den
   zum nächsten Inserat.
   ============================================================ */

import { Wordmark } from "@/components/Wordmark";
import { CANTONS, CATEGORIES } from "@/data/taxonomy";
import { useI18n } from "@/lib/i18n";
import { Bitcoin, CreditCard, ShieldCheck } from "lucide-react";
import { Link } from "wouter";

const TOP_CANTONS = ["ZH", "BE", "BS", "GE", "VD", "LU", "AG", "SG", "TI", "ZG"];

export function Footer() {
  const { t, canton: cantonName } = useI18n();

  return (
    <footer className="mt-24 border-t border-line bg-[oklch(0.095_0.008_295)]">
      <div className="container-noira py-14">
        <div className="grid gap-10 md:grid-cols-2 lg:grid-cols-5">
          <div className="lg:col-span-2">
            <Wordmark className="mb-5 text-[0.9rem]" showDomain />
            <p className="max-w-sm text-sm leading-relaxed text-muted-foreground">
{t("footer.tagline")}
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
            <p className="eyebrow mb-4">{t("footer.discover")}</p>
            <ul className="space-y-2.5 text-sm">
              {CATEGORIES.slice(0, 6).map((c) => (
                <li key={c.id}>
                  <Link
                    href={`/inserate?kategorie=${c.id}`}
                    className="text-muted-foreground transition hover:text-foreground">
                    {t(`cat.${c.id}.short`)}
                  </Link>
                </li>
              ))}
              <li>
                <Link
                  href="/inserate"
                  className="text-muted-foreground transition hover:text-foreground">
                  {t("footer.allListings")}
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <p className="eyebrow mb-4">{t("footer.regions")}</p>
            <ul className="space-y-2.5 text-sm">
              {TOP_CANTONS.slice(0, 7).map((code) => {
                const canton = CANTONS.find((c) => c.code === code);
                return (
                  <li key={code}>
                    <Link
                      href={`/inserate?kanton=${code}`}
                      className="text-muted-foreground transition hover:text-foreground">
                      {cantonName(code, canton?.name ?? code)}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>

          <div>
            <p className="eyebrow mb-4">{t("footer.platform")}</p>
            <ul className="space-y-2.5 text-sm">
              <li>
                <Link
                  href="/werben"
                  className="text-muted-foreground transition hover:text-foreground">
                  {t("nav.postAd")}
                </Link>
              </li>
              <li>
                <Link
                  href="/werben#preise"
                  className="text-muted-foreground transition hover:text-foreground">
                  {t("footer.prices")}
                </Link>
              </li>
              <li>
                <Link
                  href="/sicherheit"
                  className="text-muted-foreground transition hover:text-foreground">
                  {t("footer.safetyLong")}
                </Link>
              </li>
              <li>
                <Link
                  href="/agb"
                  className="text-muted-foreground transition hover:text-foreground">
                  {t("footer.terms")}
                </Link>
              </li>
              <li>
                <Link
                  href="/datenschutz"
                  className="text-muted-foreground transition hover:text-foreground">
                  {t("footer.privacy")}
                </Link>
              </li>
              <li>
                <Link
                  href="/impressum"
                  className="text-muted-foreground transition hover:text-foreground">
                  {t("footer.imprint")}
                </Link>
              </li>
            </ul>
          </div>
        </div>

        {/* Meldestelle — bewusst als eigener, auffälliger Block */}
        <div className="mt-12 flex flex-col gap-4 rounded-xl border border-line bg-surface/60 p-5 sm:flex-row sm:items-center">
          <ShieldCheck className="h-6 w-6 shrink-0 text-verified" strokeWidth={1.5} />
          <p className="flex-1 text-sm leading-relaxed text-muted-foreground">
<span className="text-foreground">{t("footer.reportTitle")}</span>{" "}
            {t("footer.reportText")}
          </p>
          <Link
            href="/sicherheit"
            className="shrink-0 rounded-full border border-verified/50 px-4 py-2 text-sm text-verified transition hover:bg-verified/10">
            {t("footer.reportCta")}
          </Link>
        </div>

        <div className="rule my-10" />

        <div className="flex flex-col gap-4 text-xs text-muted-foreground/80 sm:flex-row sm:items-center sm:justify-between">
          <p>{t("footer.copyright", { year: new Date().getFullYear() })}</p>
          <p className="flex items-center gap-3">
            <span className="rounded border border-destructive/50 px-2 py-0.5 font-mono text-destructive">
              18+
            </span>
            <span>{t("footer.adultsOnly")}</span>
          </p>
        </div>
      </div>
    </footer>
  );
}

export default Footer;
