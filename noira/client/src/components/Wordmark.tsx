/* ============================================================
   Wordmark — die Bildmarke von NOIRA
   Ein Rhombus mit Goldverlauf ("aura") plus Wortmarke in der
   Display-Serif. Bewusst schlicht, damit sie auch klein und
   monochrom funktioniert.
   ============================================================ */

import { cn } from "@/lib/utils";

export function Wordmark({
  className,
  showDomain = false,
}: {
  className?: string;
  showDomain?: boolean;
}) {
  return (
    <span className={cn("flex items-center gap-2.5", className)}>
      <svg viewBox="0 0 32 32" className="h-full w-auto shrink-0" aria-hidden="true">
        <defs>
          <linearGradient id="noira-mark" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#F0D9A0" />
            <stop offset="55%" stopColor="#D8B26A" />
            <stop offset="100%" stopColor="#9A7434" />
          </linearGradient>
        </defs>
        <path
          d="M16 1.5 30.5 16 16 30.5 1.5 16Z"
          fill="none"
          stroke="url(#noira-mark)"
          strokeWidth="1.4"
        />
        <path d="M16 7.5 24.5 16 16 24.5 7.5 16Z" fill="url(#noira-mark)" opacity="0.9" />
        <circle cx="16" cy="16" r="2.4" fill="#0B0A0D" />
      </svg>
      <span className="display text-[1.45em] leading-none font-medium tracking-[0.3em] text-foreground">
        NOIRA
        {showDomain && <span className="text-gold-soft">.ch</span>}
      </span>
    </span>
  );
}

export default Wordmark;
