/* ============================================================
   ListingCard — die kleinste Einheit der Plattform
   Vier Informationen entscheiden über den Klick: Wer, wo,
   ab wie viel, und wie vertrauenswürdig. Alles andere ist
   Dekoration und bleibt entsprechend zurückhaltend.
   ============================================================ */

import { Portrait } from "@/components/Portrait";
import type { Listing } from "@/data/listings";
import { CANTONS } from "@/data/taxonomy";
import { chf, isNew, relativeDay } from "@/lib/format";
import { useI18n } from "@/lib/i18n";
import { cn } from "@/lib/utils";
import { toggleSaved, useSavedIds } from "@/hooks/useSaved";
import { BadgeCheck, Camera, Heart, MapPin, Play } from "lucide-react";
import { toast } from "sonner";
import { Link } from "wouter";

export function ListingCard({
  listing,
  priority,
  imageUrl,
  asPreview,
}: {
  listing: Listing;
  priority?: boolean;
  /** Echtes Bild statt Platzhalter — genutzt von der Live-Vorschau im Editor */
  imageUrl?: string;
  /** Vorschau ist nicht anklickbar: im Editor führt der Klick sonst aus dem Formular */
  asPreview?: boolean;
}) {
  const { t, locale } = useI18n();
  const canton = CANTONS.find((c) => c.code === listing.canton);
  const fresh = isNew(listing.published);
  const saved = useSavedIds().includes(listing.id);

  const shellClass = cn(
    "card-noir flex flex-col overflow-hidden",
    listing.premium && "ring-1 ring-gold/25",
  );

  const body = (
    <>
      <div className="relative aspect-[3/4] overflow-hidden">
        {imageUrl ? (
          <img
            src={imageUrl}
            alt=""
            className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-[1.04]"
          />
        ) : (
          <Portrait
            name={listing.name}
            motif={listing.motif}
            className="h-full w-full transition-transform duration-700 group-hover:scale-[1.04]"
          />
        )}

        {/* Badges oben links */}
        <div className="absolute top-3 left-3 flex flex-col items-start gap-1.5">
          {listing.premium && (
            <span className="rounded-full bg-gold px-2.5 py-1 font-mono text-[0.625rem] font-semibold tracking-widest text-ink uppercase">
              {t("card.premium")}
            </span>
          )}
          {fresh && !listing.premium && (
            <span className="rounded-full bg-orchid px-2.5 py-1 font-mono text-[0.625rem] font-semibold tracking-widest text-ink uppercase">
              {t("card.new")}
            </span>
          )}
        </div>

        {/* Medien-Hinweise oben rechts */}
        <div className="absolute top-3 right-3 flex items-center gap-1.5">
          {listing.hasVideo && (
            /* Auf schmalen Karten nur das Symbol — sonst stösst die
               Medienzeile mit dem Premium-Zeichen zusammen. */
            <span className="flex items-center gap-1 rounded-full bg-black/55 px-2 py-1 text-[0.625rem] text-white backdrop-blur-sm">
              <Play className="h-2.5 w-2.5 fill-current" />
              <span className="hidden sm:inline">{t("card.video")}</span>
            </span>
          )}
          {listing.photos > 0 && (
            <span className="flex items-center gap-1 rounded-full bg-black/55 px-2 py-1 text-[0.625rem] text-white backdrop-blur-sm">
              <Camera className="h-2.5 w-2.5" strokeWidth={2} /> {listing.photos}
            </span>
          )}
        </div>

        {/* Online-Status unten links */}
        {listing.online && (
          <span className="absolute bottom-3 left-3 flex items-center gap-1.5 rounded-full bg-black/55 px-2.5 py-1 text-[0.625rem] text-white backdrop-blur-sm">
            <span className="relative flex h-1.5 w-1.5">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-verified opacity-75" />
              <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-verified" />
            </span>
            {t("card.online")}
          </span>
        )}
      </div>

      <div className="flex flex-1 flex-col p-4">
        <div className="flex items-baseline gap-2">
          <h3 className="display-sm truncate text-[1.375rem] text-foreground">{listing.name}</h3>
          {listing.age > 0 && (
            <span className="text-sm text-muted-foreground">{listing.age}</span>
          )}
          {listing.verified && (
            <BadgeCheck
              className="ml-auto h-4 w-4 shrink-0 text-verified"
              strokeWidth={1.8}
              aria-label={t("card.verified")}
            />
          )}
        </div>

        <p className="mt-1 flex items-center gap-1 text-xs text-muted-foreground">
          <MapPin className="h-3 w-3" strokeWidth={1.6} />
          {listing.city}
          <span className="text-text-3">·</span>
          {canton?.code}
          <span className="text-text-3">·</span>
          {t(`cat.${listing.category}.short`)}
        </p>

        <p className="mt-3 line-clamp-2 text-sm leading-relaxed text-muted-foreground">
          {listing.tagline}
        </p>

        <div className="mt-auto flex flex-col items-start gap-0.5 pt-4 sm:flex-row sm:items-end sm:justify-between sm:gap-2">
          <span className="text-sm whitespace-nowrap text-foreground">
            {t("card.from")}{" "}
            <span className="text-gold">{chf(listing.rates.m30 ?? listing.rates.h1)}</span>
            <span className="text-xs text-muted-foreground">
              {listing.rates.m30 ? t("card.per30") : t("card.perHour")}
            </span>
          </span>
          <span className="text-[0.6875rem] whitespace-nowrap text-text-3">
            {priority ? t("card.topPlacement") : relativeDay(listing.published, locale)}
          </span>
        </div>
      </div>
    </>
  );

  // Die Vorschau im Editor darf nicht navigieren — sonst verlässt man
  // beim Draufklicken das eigene Formular.
  if (asPreview) return <div className={shellClass}>{body}</div>;

  // Der Merken-Knopf liegt bewusst neben dem Link statt darin: ein
  // <button> in einem <a> ist ungültiges Markup und verhält sich mit
  // Tastatur und Screenreader unberechenbar.
  return (
    <div className="group relative">
      <Link href={`/inserat/${listing.slug}`} className={shellClass}>
        {body}
      </Link>

      <button
        onClick={() => {
          const now = toggleSaved(listing.id);
          toast.success(now ? t("saved.added") : t("saved.removed"));
        }}
        aria-pressed={saved}
        aria-label={t(saved ? "card.unsave" : "card.save", { name: listing.name })}
        className={cn(
          /* Unterhalb der Medienzeile, damit sich nichts überlagert */
          "absolute top-11 right-3 z-10 rounded-full bg-black/55 p-2 backdrop-blur-sm transition",
          "hover:bg-black/75 focus-visible:opacity-100",
          saved
            ? "text-orchid opacity-100"
            : "text-white opacity-0 group-hover:opacity-100 max-lg:opacity-100",
        )}>
        <Heart className={cn("h-3.5 w-3.5", saved && "fill-current")} strokeWidth={1.8} />
      </button>
    </div>
  );
}

export default ListingCard;
