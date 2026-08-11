import { ArrowRight } from "lucide-react";
import { Link } from "wouter";

export default function NotFound() {
  return (
    <div className="container-noira flex min-h-[70vh] flex-col items-center justify-center py-20 text-center">
      <p className="eyebrow mb-6">Fehler 404</p>
      <h1 className="display mb-5 text-[clamp(3rem,10vw,7rem)]">
        Hier ist <span className="text-gilded italic">niemand.</span>
      </h1>
      <p className="mb-9 max-w-md leading-relaxed text-muted-foreground">
        Diese Seite gibt es nicht mehr — vielleicht ist das Inserat abgelaufen oder wurde entfernt.
        Die Suche hilft weiter.
      </p>
      <div className="flex flex-wrap justify-center gap-3">
        <Link
          href="/inserate"
          className="inline-flex items-center gap-2 rounded-full bg-gold px-6 py-3.5 text-sm font-semibold text-ink transition hover:brightness-110">
          Zur Suche <ArrowRight className="h-4 w-4" strokeWidth={2} />
        </Link>
        <Link
          href="/"
          className="rounded-full border border-line px-6 py-3.5 text-sm transition hover:border-gold/50">
          Startseite
        </Link>
      </div>
    </div>
  );
}
