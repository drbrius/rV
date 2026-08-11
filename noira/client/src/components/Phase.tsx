/* ============================================================
   Phase — die Kategorie-Zeichen

   Jede Kategorie bekommt eine eigene Phase derselben Eklipse:
   gleiche Scheibe, gleicher Lichtsaum, nur der Winkel der
   Verdeckung ändert sich. So entsteht ein Zeichensatz, der als
   Familie erkennbar ist, statt neun zufällig zusammengesuchter
   Symbole.

   Sie stehen immer neben der Beschriftung, nie an ihrer Stelle:
   Ein Zeichen, das Bedeutung erst erklären muss, darf nicht
   allein navigieren.
   ============================================================ */

import { cn } from "@/lib/utils";

let uid = 0;

/** Winkel (Grad) und Abstand der verdeckenden Scheibe je Phase. */
const PHASES: [angle: number, distance: number][] = [
  [215, 7.5], // Begleitung — Sichel rechts oben
  [180, 9.5], // Massage — schmale Sichel rechts
  [270, 6.5], // Dominanz — starke Verdeckung von unten
  [135, 8.5], // Trans
  [90, 11], // Paare — fast volle Scheibe
  [45, 8.5], // Herren
  [0, 9.5], // Clubs
  [315, 7], // Studios
  [235, 12], // Digital — nur ein Rand bleibt dunkel
];

export function Phase({ phase, className }: { phase: number; className?: string }) {
  const id = `ph-${(uid += 1)}`;
  const [angle, distance] = PHASES[phase % PHASES.length];
  const rad = (angle * Math.PI) / 180;
  const dx = 12 + Math.cos(rad) * distance;
  const dy = 12 - Math.sin(rad) * distance;

  return (
    <svg viewBox="0 0 24 24" className={cn("shrink-0", className)} aria-hidden="true">
      <defs>
        <mask id={id}>
          <circle cx="12" cy="12" r="8.2" fill="#fff" />
          <circle cx={dx} cy={dy} r="8.2" fill="#000" />
        </mask>
      </defs>
      <circle cx="12" cy="12" r="10.4" fill="none" stroke="currentColor" strokeWidth="0.9" opacity="0.3" />
      <circle cx="12" cy="12" r="8.2" fill="currentColor" mask={`url(#${id})`} />
    </svg>
  );
}

export default Phase;
