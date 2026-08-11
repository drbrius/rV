/* ============================================================
   AgeGate — Zutrittsschranke ab 18
   Wird vor allem anderen gerendert und blockiert die Seite, bis
   das Alter bestätigt ist. Die Bestätigung liegt in localStorage,
   damit wiederkehrende Besuchende nicht bei jedem Aufruf
   gestoppt werden.
   ============================================================ */

import { useEffect, useState } from "react";
import { Link } from "wouter";
import { Wordmark } from "./Wordmark";

const STORAGE_KEY = "noira.agegate.v1";
const EXIT_URL = "https://www.google.ch";

export function AgeGate() {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      const confirmedAt = raw ? Number(raw) : 0;
      // Bestätigung 90 Tage gültig
      const valid = confirmedAt > Date.now() - 90 * 24 * 60 * 60 * 1000;
      setOpen(!valid);
    } catch {
      setOpen(true);
    }
  }, []);

  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  if (!open) return null;

  const confirm = () => {
    try {
      localStorage.setItem(STORAGE_KEY, String(Date.now()));
    } catch {
      /* Privater Modus: dann eben pro Sitzung */
    }
    setOpen(false);
  };

  return (
    <div
      className="fixed inset-0 z-100 flex items-center justify-center bg-ink/95 px-5 backdrop-blur-xl"
      role="dialog"
      aria-modal="true"
      aria-labelledby="agegate-title">
      <div className="aura -top-24 left-1/3 h-96 w-96" style={{ background: "#6D2C4E" }} />
      <div className="relative w-full max-w-lg card-noir p-8 text-center sm:p-10">
        <Wordmark className="mx-auto mb-7 h-7 justify-center" />
        <p className="eyebrow mb-4">Zutritt ab 18 Jahren</p>
        <h1 id="agegate-title" className="display mb-4 text-3xl sm:text-4xl">
          Diese Seite enthält Inhalte für <span className="text-gilded">Erwachsene</span>
        </h1>
        <p className="mx-auto mb-7 max-w-md text-sm leading-relaxed text-muted-foreground">
          NOIRA ist eine Inserateplattform für erotische Dienstleistungen in der Schweiz. Mit dem
          Betreten bestätigen Sie, dass Sie mindestens 18 Jahre alt sind, dass solche Inhalte an
          Ihrem Aufenthaltsort erlaubt sind und dass Sie sie freiwillig aufrufen.
        </p>

        <div className="flex flex-col gap-3 sm:flex-row">
          <button
            onClick={confirm}
            className="flex-1 rounded-lg bg-gold px-6 py-3.5 text-sm font-semibold text-ink transition hover:brightness-110 active:scale-[0.99]">
            Ich bin 18 oder älter — eintreten
          </button>
          <a
            href={EXIT_URL}
            className="flex-1 rounded-lg border border-line px-6 py-3.5 text-sm font-medium text-muted-foreground transition hover:border-foreground/40 hover:text-foreground">
            Ich bin jünger — verlassen
          </a>
        </div>

        <p className="mt-7 text-xs leading-relaxed text-muted-foreground/70">
          Wir setzen nur technisch notwendige Cookies. Details in der{" "}
          <Link href="/datenschutz" className="text-gold-soft underline underline-offset-2">
            Datenschutzerklärung
          </Link>
          . Hinweise auf Zwang, Ausbeutung oder Minderjährige melden Sie bitte sofort über{" "}
          <Link href="/sicherheit" className="text-gold-soft underline underline-offset-2">
            Sicherheit &amp; Meldestelle
          </Link>
          .
        </p>
      </div>
    </div>
  );
}

export default AgeGate;
