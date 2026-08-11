/* ============================================================
   Anmelden / Registrieren
   Ein Konto braucht nur, wer inseriert oder Nachrichten
   empfängt. Suchende bleiben bewusst kontolos.
   ============================================================ */

import { Wordmark } from "@/components/Wordmark";
import { cn } from "@/lib/utils";
import { Eye, EyeOff, Lock, Mail } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { Link, useLocation } from "wouter";

const inputClass =
  "w-full rounded-lg border border-line bg-surface-2/60 py-3 pr-4 pl-11 text-sm placeholder:text-muted-foreground/60 focus:border-gold/60 focus:outline-none";

export default function Login() {
  const [location] = useLocation();
  const [mode, setMode] = useState<"login" | "register">(
    location === "/registrieren" ? "register" : "login",
  );
  const [showPw, setShowPw] = useState(false);

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    toast.info("Demo-Oberfläche — die Anmeldung ist noch nicht angebunden.");
  };

  return (
    <div className="container-noira flex min-h-[75vh] items-center justify-center py-14">
      <div className="w-full max-w-md">
        <Wordmark className="mb-9 flex justify-center text-[0.95rem]" />

        <div className="card-noir p-7 sm:p-8">
          <div className="mb-7 grid grid-cols-2 rounded-full border border-line p-1">
            {(
              [
                { id: "login", label: "Anmelden" },
                { id: "register", label: "Konto erstellen" },
              ] as const
            ).map((t) => (
              <button
                key={t.id}
                onClick={() => setMode(t.id)}
                className={cn(
                  "rounded-full py-2.5 text-sm transition",
                  mode === t.id
                    ? "bg-gold font-semibold text-ink"
                    : "text-muted-foreground hover:text-foreground",
                )}>
                {t.label}
              </button>
            ))}
          </div>

          <form onSubmit={submit} className="space-y-4">
            <label className="relative block">
              <Mail
                className="absolute top-1/2 left-4 h-4 w-4 -translate-y-1/2 text-muted-foreground"
                strokeWidth={1.6}
              />
              <input
                type="email"
                required
                placeholder="E-Mail-Adresse"
                autoComplete="email"
                className={inputClass}
              />
            </label>

            <label className="relative block">
              <Lock
                className="absolute top-1/2 left-4 h-4 w-4 -translate-y-1/2 text-muted-foreground"
                strokeWidth={1.6}
              />
              <input
                type={showPw ? "text" : "password"}
                required
                minLength={10}
                placeholder="Passwort"
                autoComplete={mode === "login" ? "current-password" : "new-password"}
                className={cn(inputClass, "pr-11")}
              />
              <button
                type="button"
                onClick={() => setShowPw((v) => !v)}
                className="absolute top-1/2 right-3 -translate-y-1/2 p-1 text-muted-foreground transition hover:text-foreground"
                aria-label={showPw ? "Passwort verbergen" : "Passwort anzeigen"}>
                {showPw ? (
                  <EyeOff className="h-4 w-4" strokeWidth={1.6} />
                ) : (
                  <Eye className="h-4 w-4" strokeWidth={1.6} />
                )}
              </button>
            </label>

            {mode === "register" && (
              <label className="flex cursor-pointer items-start gap-2.5 text-xs leading-relaxed text-muted-foreground">
                <input
                  type="checkbox"
                  required
                  className="mt-0.5 h-4 w-4 shrink-0 accent-[color:var(--noira-gold)]"
                />
                <span>
                  Ich bin mindestens 18 Jahre alt und akzeptiere die{" "}
                  <Link href="/agb" className="text-gold-soft underline underline-offset-2">
                    AGB
                  </Link>{" "}
                  und die{" "}
                  <Link href="/datenschutz" className="text-gold-soft underline underline-offset-2">
                    Datenschutzerklärung
                  </Link>
                  .
                </span>
              </label>
            )}

            <button
              type="submit"
              className="w-full rounded-full bg-gold px-6 py-3.5 text-sm font-semibold text-ink transition hover:brightness-110">
              {mode === "login" ? "Anmelden" : "Konto erstellen"}
            </button>
          </form>

          {mode === "login" && (
            <button
              onClick={() => toast.info("Wir würden Ihnen jetzt einen Link senden.")}
              className="mt-5 w-full text-center text-xs text-muted-foreground underline underline-offset-4 transition hover:text-foreground">
              Passwort vergessen?
            </button>
          )}
        </div>

        <p className="mt-7 text-center text-xs leading-relaxed text-muted-foreground/70">
          Ein Konto brauchen nur Inserierende und wer Nachrichten empfangen möchte. Suchen und
          Kontaktieren funktioniert ohne Anmeldung — und ohne dass wir wissen, wer Sie sind.
        </p>
      </div>
    </div>
  );
}
