/* ============================================================
   Merkliste
   Kein Konto, kein Server — die Liste liegt im Browser. Genau
   darum steht hier auch der Hinweis, was das bedeutet: Wer den
   Verlauf löscht oder das Gerät wechselt, fängt neu an. Das ist
   der Preis dafür, dass wir nicht wissen, was Sie sich merken.
   ============================================================ */

import { ListingCard } from "@/components/ListingCard";
import { LISTINGS } from "@/data/listings";
import { clearSaved, useSavedIds } from "@/hooks/useSaved";
import { useI18n } from "@/lib/i18n";
import { ArrowRight, Heart, Info } from "lucide-react";
import { toast } from "sonner";
import { Link } from "wouter";

export default function Saved() {
  const ids = useSavedIds();
  const { t } = useI18n();
  // Reihenfolge der Merkliste beibehalten: zuletzt gemerkt zuoberst.
  const items = ids.map((id) => LISTINGS.find((l) => l.id === id)).filter((l) => l !== undefined);

  return (
    <div className="container-noira py-12">
      <p className="eyebrow mb-3">{t("saved.eyebrow")}</p>
      <div className="mb-10 flex flex-wrap items-end justify-between gap-4">
        <h1 className="display text-4xl sm:text-5xl">
          {items.length > 0 ? (
            <>
              {items.length} <span className="text-muted-foreground">{t("saved.count")}</span>
            </>
          ) : (
            t("saved.emptyHeading")
          )}
        </h1>

        {items.length > 0 && (
          <button
            onClick={() => {
              clearSaved();
              toast.success(t("saved.cleared"));
            }}
            className="rounded-full border border-line px-5 py-2.5 text-sm text-muted-foreground transition hover:border-destructive/50 hover:text-destructive">
            {t("saved.clear")}
          </button>
        )}
      </div>

      {items.length === 0 ? (
        <div className="card-noir flex flex-col items-center px-6 py-20 text-center">
          <Heart className="mb-5 h-8 w-8 text-text-3" strokeWidth={1.3} />
          <p className="display mb-3 text-3xl">{t("saved.emptyTitle")}</p>
          <p className="mb-7 max-w-sm text-sm leading-relaxed text-muted-foreground">
{t("saved.emptyText")}
          </p>
          <Link
            href="/inserate"
            className="inline-flex items-center gap-2 rounded-full bg-gold px-6 py-3.5 text-sm font-semibold text-ink transition hover:brightness-110">
            {t("saved.browse")} <ArrowRight className="h-4 w-4" strokeWidth={2} />
          </Link>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 xl:grid-cols-4">
            {items.map((l) => (
              <ListingCard key={l.id} listing={l} />
            ))}
          </div>

          {ids.length > items.length && (
            <p className="mt-8 flex items-start gap-2 rounded-xl border border-line bg-surface/60 p-4 text-xs leading-relaxed text-muted-foreground">
              <Info className="mt-px h-3.5 w-3.5 shrink-0 text-gold" strokeWidth={1.6} />
{t("saved.gone", { n: ids.length - items.length })}
            </p>
          )}
        </>
      )}

      <p className="mt-10 text-xs leading-relaxed text-text-3">
{t("saved.note")}
      </p>
    </div>
  );
}
