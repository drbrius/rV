/* Formatierungs-Helfer im Schweizer Format (Apostroph als Tausendertrennung). */

export function chf(value: number, withCurrency = true) {
  const n = new Intl.NumberFormat("de-CH", { maximumFractionDigits: 2 }).format(value);
  return withCurrency ? `CHF ${n}` : n;
}

export function compactNumber(value: number) {
  return new Intl.NumberFormat("de-CH", { notation: "compact", maximumFractionDigits: 1 }).format(
    value,
  );
}

/** "vor 3 Tagen" / "heute" — für Inserate-Aktualität. */
export function relativeDay(iso: string, now = new Date()) {
  const then = new Date(`${iso}T00:00:00`);
  const days = Math.round((now.getTime() - then.getTime()) / 86_400_000);
  if (days <= 0) return "heute";
  if (days === 1) return "gestern";
  if (days < 7) return `vor ${days} Tagen`;
  if (days < 14) return "letzte Woche";
  if (days < 60) return `vor ${Math.floor(days / 7)} Wochen`;
  return `vor ${Math.floor(days / 30)} Monaten`;
}

export function isNew(iso: string, now = new Date()) {
  return (now.getTime() - new Date(`${iso}T00:00:00`).getTime()) / 86_400_000 <= 7;
}
