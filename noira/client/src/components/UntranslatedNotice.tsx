/* ============================================================
   Hinweis auf noch nicht übersetzte Seiten

   Ehrlicher als die Alternativen: Eine maschinelle Übersetzung
   von AGB, Sicherheitshinweisen und Preisangaben wäre auf einer
   Erotikplattform ein Haftungsrisiko, und stillschweigend
   Deutsch auszuliefern lässt Fragen offen. Also sagen wir, was
   Sache ist — an einer Stelle, im Layout, statt auf jeder Seite
   einzeln.

   Sobald eine Seite übersetzt ist, verschwindet sie aus
   UNTRANSLATED und der Hinweis dort mit ihr.
   ============================================================ */

import { useI18n } from "@/lib/i18n";
import { Languages } from "lucide-react";
import { useLocation } from "wouter";

/** Routen, deren Fliesstext noch nicht übersetzt ist. */
const UNTRANSLATED = [
  "/",
  "/inserat/",
  "/clubs",
  "/werben",
  "/inserat-erfassen",
  "/kasse",
  "/login",
  "/registrieren",
  "/sicherheit",
  "/agb",
  "/datenschutz",
  "/impressum",
];

export function UntranslatedNotice() {
  const [location] = useLocation();
  const { t, isGerman, localeName } = useI18n();

  if (isGerman) return null;

  const affected =
    location === "/" || UNTRANSLATED.some((r) => r !== "/" && location.startsWith(r));
  if (!affected) return null;

  return (
    <div className="border-b border-line bg-surface/60">
      <div className="container-noira flex items-start gap-3 py-3">
        <Languages className="mt-0.5 h-4 w-4 shrink-0 text-gold" strokeWidth={1.6} />
        <p className="text-xs leading-relaxed text-muted-foreground">
          <span className="text-foreground">
            {t("untranslated.title", { language: localeName })}
          </span>{" "}
          {t("untranslated.body")}
        </p>
      </div>
    </div>
  );
}

export default UntranslatedNotice;
