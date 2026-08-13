import { useI18n } from "@/lib/i18n";
import { ArrowRight } from "lucide-react";
import { Link } from "wouter";

export default function NotFound() {
  const { t } = useI18n();

  return (
    <div className="container-noira flex min-h-[70vh] flex-col items-center justify-center py-20 text-center">
      <p className="eyebrow mb-6">{t("404.eyebrow")}</p>
      <h1 className="display mb-5 text-[clamp(3rem,10vw,7rem)]">
        {t("404.title")} <span className="text-gilded italic">{t("404.titleAccent")}</span>
      </h1>
      <p className="mb-9 max-w-md leading-relaxed text-muted-foreground">
{t("404.body")}
      </p>
      <div className="flex flex-wrap justify-center gap-3">
        <Link
          href="/inserate"
          className="inline-flex items-center gap-2 rounded-full bg-gold px-6 py-3.5 text-sm font-semibold text-ink transition hover:brightness-110">
          {t("404.toSearch")} <ArrowRight className="h-4 w-4" strokeWidth={2} />
        </Link>
        <Link
          href="/"
          className="rounded-full border border-line px-6 py-3.5 text-sm transition hover:border-gold/50">
          {t("404.home")}
        </Link>
      </div>
    </div>
  );
}
