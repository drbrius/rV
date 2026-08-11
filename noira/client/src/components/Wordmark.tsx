/* ============================================================
   Wordmark — die Bildmarke von NOIRA

   Konzept: die Eklipse. Der Name trägt sie bereits in sich —
   NOIR (die verdeckte Scheibe) und AURA (die Korona, die
   darum herum leuchtet). Genau das ist die Marke: nichts wird
   ausgestellt, alles leuchtet am Rand.

   Das Zeichen ersetzt das O im Wort. Es ist ein Kreis und
   liest sich darum auch dann als Buchstabe, wenn man das
   Konzept nicht kennt — die Bedingung dafür, dass ein Logo
   ungewöhnlich sein darf.

   Der helle Punkt am dicksten Teil der Sichel ist der
   Diamantring-Effekt einer echten Sonnenfinsternis.
   ============================================================ */

import { cn } from "@/lib/utils";

let uid = 0;

/** Das Zeichen allein — Favicon, App-Icon, Ladezustände. */
export function EclipseMark({
  className,
  title,
}: {
  className?: string;
  title?: string;
}) {
  // Eigene IDs pro Instanz, sonst kollidieren Maske und Verlauf,
  // sobald mehrere Marken gleichzeitig im DOM stehen.
  const id = `ecl-${(uid += 1)}`;

  return (
    <svg viewBox="0 0 40 40" className={className} role={title ? "img" : "presentation"}>
      {title && <title>{title}</title>}
      <defs>
        <linearGradient id={`${id}-corona`} x1="0.15" y1="1" x2="0.85" y2="0">
          <stop offset="0%" stopColor="var(--noira-gold-soft)" />
          <stop offset="55%" stopColor="var(--noira-gold)" />
          <stop offset="100%" stopColor="var(--noira-corona)" />
        </linearGradient>
        <mask id={`${id}-crescent`}>
          <circle cx="20" cy="20" r="15.5" fill="#fff" />
          <circle cx="15.2" cy="24.8" r="15.5" fill="#000" />
        </mask>
      </defs>

      {/* Korona: der Lichtsaum, der die Scheibe überhaupt sichtbar macht */}
      <circle
        cx="20"
        cy="20"
        r="18.4"
        fill="none"
        stroke={`url(#${id}-corona)`}
        strokeWidth="1.1"
        opacity="0.55"
      />

      {/* Die verdeckte Scheibe */}
      <circle cx="20" cy="20" r="15.5" fill="var(--noira-ink)" />

      {/* Die Sichel */}
      <circle cx="20" cy="20" r="15.5" fill={`url(#${id}-corona)`} mask={`url(#${id}-crescent)`} />

      {/* Diamantring */}
      <circle cx="30.2" cy="12.4" r="2.4" fill="var(--noira-corona)" />
    </svg>
  );
}

type Props = {
  className?: string;
  showDomain?: boolean;
  /** Nur das Zeichen, ohne Schriftzug */
  markOnly?: boolean;
};

export function Wordmark({ className, showDomain = false, markOnly = false }: Props) {
  if (markOnly) return <EclipseMark className={className} title="NOIRA" />;

  return (
    <span
      className={cn("inline-flex items-center leading-none", className)}
      aria-label="NOIRA"
      role="img">
      {/* Die Abstände sind von Hand gesetzt, nicht der Laufweite
          überlassen: letter-spacing wirkt nur rechts vom Zeichen und
          würde die Lücke vor dem Zeichen kleiner machen als danach. */}
      <span className="display mr-[0.34em] text-[1.5em] leading-none font-medium" aria-hidden>
        N
      </span>
      <EclipseMark className="mr-[0.34em] h-[1.28em] w-[1.28em] shrink-0" />
      <span className="display text-[1.5em] leading-none font-medium tracking-[0.26em]" aria-hidden>
        IRA
      </span>
      {showDomain && (
        <span className="display -ml-[0.3em] text-[1.5em] leading-none font-medium text-gold-soft">
          .ch
        </span>
      )}
    </span>
  );
}

export default Wordmark;
