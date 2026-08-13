/* ============================================================
   Portrait — Platzhalter statt Foto
   Im Demo-Datensatz gibt es bewusst keine Personenbilder. Diese
   Komponente erzeugt aus der Inserat-ID ein stabiles, abstraktes
   Farbmotiv mit Monogramm; in Produktion tritt hier das erste
   freigegebene Foto des Inserats an ihre Stelle.
   ============================================================ */

import { cn } from "@/lib/utils";

const MOTIFS = [
  { from: "#3B1E3A", via: "#6D2C4E", to: "#1A1119" }, // Pflaume
  { from: "#1E2A3B", via: "#2F5468", to: "#101519" }, // Mitternachtsblau
  { from: "#3A2416", via: "#7A4B22", to: "#17110C" }, // Cognac
  { from: "#2A1B3D", via: "#4B3A7A", to: "#121020" }, // Amethyst
  { from: "#1C2E28", via: "#2F5C4B", to: "#0F1614" }, // Smaragd
  { from: "#3B2020", via: "#7A3535", to: "#1A1010" }, // Burgund
];

type Props = {
  name: string;
  motif: number;
  className?: string;
  /** Monogramm ausblenden, z. B. in sehr kleinen Thumbnails */
  compact?: boolean;
};

export function Portrait({ name, motif, className, compact = false }: Props) {
  const m = MOTIFS[motif % MOTIFS.length];
  const initials = name
    .split(/[\s&]+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0])
    .join("");

  return (
    <div
      className={cn("relative isolate overflow-hidden bg-ink", className)}
      role="img"
      aria-label={`Platzhalterbild für ${name}`}>
      <div
        className="absolute inset-0"
        style={{
          background: `radial-gradient(120% 90% at 30% 10%, ${m.via} 0%, ${m.from} 45%, ${m.to} 100%)`,
        }}
      />
      {/* Weiche Lichtkante — gibt der Fläche Tiefe ohne Bildinhalt */}
      <div
        className="absolute inset-0 opacity-70"
        style={{
          background:
            "radial-gradient(60% 45% at 70% 85%, rgba(255,255,255,0.16), transparent 70%)",
        }}
      />
      <div className="grain absolute inset-0" />
      {!compact && (
        <div className="absolute inset-0 flex items-center justify-center">
          {/* Monogramm im Lichtring — die Eklipse als Rahmen für den Namen */}
          <span className="relative flex aspect-square w-[42%] items-center justify-center rounded-full border border-white/25">
            <span className="display select-none text-[clamp(1.75rem,5.5vw,3rem)] tracking-[0.06em] text-white/55">
              {initials}
            </span>
          </span>
        </div>
      )}
      <div className="absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-black/70 to-transparent" />
    </div>
  );
}

export default Portrait;
