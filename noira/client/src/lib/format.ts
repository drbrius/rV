/* Formatierungs-Helfer.

   Beträge bleiben bewusst im Schweizer Format mit Apostroph
   (CHF 1'200) — das ist hierzulande in allen vier Sprachregionen
   die gewohnte Schreibweise, auch auf französischen Seiten.
   Zeitangaben dagegen müssen der gewählten Sprache folgen: „vor
   2 Wochen" auf einer französischen Seite ist schlicht falsch. */

import { getLocale, type Locale } from "@/lib/i18n";

export function chf(value: number, withCurrency = true) {
  const n = new Intl.NumberFormat("de-CH", { maximumFractionDigits: 2 }).format(value);
  return withCurrency ? `CHF ${n}` : n;
}

export function compactNumber(value: number) {
  return new Intl.NumberFormat("de-CH", { notation: "compact", maximumFractionDigits: 1 }).format(
    value,
  );
}

/**
 * „vor 3 Tagen" / „il y a 3 jours" / „3 days ago".
 * Intl.RelativeTimeFormat liefert die Sonderfälle heute/gestern
 * gratis mit (`numeric: "auto"`) — von Hand gepflegte Listen
 * dafür sind in vier Sprachen nur eine Fehlerquelle.
 */
export function relativeDay(iso: string, locale: Locale = getLocale(), now = new Date()) {
  const then = new Date(`${iso}T00:00:00`);
  const days = Math.round((now.getTime() - then.getTime()) / 86_400_000);
  const rtf = new Intl.RelativeTimeFormat(locale, { numeric: "auto" });

  if (days <= 0) return rtf.format(0, "day");
  if (days < 7) return rtf.format(-days, "day");
  if (days < 30) return rtf.format(-Math.floor(days / 7), "week");
  if (days < 365) return rtf.format(-Math.floor(days / 30), "month");
  return rtf.format(-Math.floor(days / 365), "year");
}

export function isNew(iso: string, now = new Date()) {
  return (now.getTime() - new Date(`${iso}T00:00:00`).getTime()) / 86_400_000 <= 7;
}
