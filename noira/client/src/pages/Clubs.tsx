/* ============================================================
   Clubs & Studios
   Häuser brauchen eine andere Karte als Personen: Öffnungs-
   zeiten, Eintritt und Adresse zählen mehr als ein Portrait.
   ============================================================ */

import { Portrait } from "@/components/Portrait";
import { LISTINGS } from "@/data/listings";
import { CANTONS } from "@/data/taxonomy";
import { chf, compactNumber } from "@/lib/format";
import { BadgeCheck, ArrowRight, Clock, MapPin, Ticket } from "lucide-react";
import { Link } from "wouter";

export default function Clubs() {
  const houses = LISTINGS.filter((l) => l.category === "club" || l.category === "studio");

  return (
    <div className="container-noira py-12">
      <p className="eyebrow mb-6">Häuser</p>
      <h1 className="display max-w-3xl text-[clamp(2.5rem,6vw,4.5rem)]">
        Clubs, Sauna &amp; <span className="text-gilded italic">Studios</span>
      </h1>
      <p className="mt-6 max-w-xl leading-relaxed text-muted-foreground">
        Feste Adressen mit Empfang, Infrastruktur und wechselnden Anbietenden. Der Eintritt geht an
        das Haus — alles Weitere wird direkt mit den anwesenden Personen abgemacht.
      </p>

      <div className="mt-12 space-y-4">
        {houses.map((h) => {
          const canton = CANTONS.find((c) => c.code === h.canton);
          return (
            <Link
              key={h.id}
              href={`/inserat/${h.slug}`}
              className="card-noir group grid gap-6 overflow-hidden p-4 sm:grid-cols-[14rem_1fr] sm:p-5">
              <Portrait
                name={h.name}
                motif={h.motif}
                className="aspect-[4/3] w-full rounded-xl sm:aspect-auto sm:h-full"
              />

              <div className="flex flex-col">
                <div className="flex flex-wrap items-center gap-3">
                  <h2 className="display text-2xl sm:text-3xl">{h.name}</h2>
                  {h.verified && (
                    <BadgeCheck className="h-5 w-5 text-verified" strokeWidth={1.6} />
                  )}
                  {h.premium && (
                    <span className="rounded-full bg-gold px-2.5 py-1 font-mono text-[0.625rem] font-semibold tracking-widest text-ink uppercase">
                      Premium
                    </span>
                  )}
                </div>

                <p className="mt-2 text-sm text-muted-foreground">{h.tagline}</p>
                <p className="mt-3 line-clamp-2 max-w-2xl text-sm leading-relaxed text-muted-foreground">
                  {h.about}
                </p>

                <div className="mt-5 flex flex-wrap items-center gap-x-6 gap-y-2 text-xs text-muted-foreground">
                  <span className="flex items-center gap-1.5">
                    <MapPin className="h-3.5 w-3.5" strokeWidth={1.6} />
                    {h.city}, {canton?.name}
                  </span>
                  <span className="flex items-center gap-1.5">
                    <Clock className="h-3.5 w-3.5" strokeWidth={1.6} />
                    {h.availability}
                  </span>
                  <span className="flex items-center gap-1.5">
                    <Ticket className="h-3.5 w-3.5" strokeWidth={1.6} />
                    Eintritt ab {chf(h.rates.h1)}
                  </span>
                  <span>{compactNumber(h.views)} Aufrufe</span>
                </div>

                <span className="mt-5 flex items-center gap-1.5 text-sm text-gold-soft transition group-hover:text-gold">
                  Haus ansehen <ArrowRight className="h-4 w-4" strokeWidth={1.6} />
                </span>
              </div>
            </Link>
          );
        })}
      </div>

      <div className="card-noir mt-12 flex flex-col items-start justify-between gap-6 p-8 sm:flex-row sm:items-center">
        <div>
          <h2 className="display mb-2 text-2xl">Sie führen ein Haus?</h2>
          <p className="max-w-lg text-sm text-muted-foreground">
            Club-Profile enthalten Öffnungszeiten, Eintrittspreise, Anfahrt und ein Wochenprogramm —
            und auf Wunsch die Profile aller anwesenden Personen unter einem Dach.
          </p>
        </div>
        <Link
          href="/werben"
          className="shrink-0 rounded-full bg-gold px-6 py-3.5 text-sm font-semibold text-ink transition hover:brightness-110">
          Haus eintragen
        </Link>
      </div>
    </div>
  );
}
