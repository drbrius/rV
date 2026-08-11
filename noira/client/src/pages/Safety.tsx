/* ============================================================
   Sicherheit & Meldestelle
   Diese Seite ist kein Feigenblatt: Sie erklärt die Regeln,
   nennt echte Anlaufstellen und stellt das Meldeformular an
   den Anfang statt ans Ende.
   ============================================================ */

import { cn } from "@/lib/utils";
import {
  BadgeCheck,
  FileCheck2,
  Heart,
  Phone,
  ShieldAlert,
  ShieldCheck,
  UserX,
} from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

const HELP = [
  {
    name: "Notruf Polizei",
    contact: "117",
    text: "Bei akuter Gefahr, Gewalt oder unmittelbarem Verdacht auf Zwang.",
  },
  {
    name: "ACT212 — Fachstelle Menschenhandel",
    contact: "0840 212 212",
    text: "Nationale Meldestelle, rund um die Uhr, auch anonym und für Dritte.",
  },
  {
    name: "FIZ Fachstelle Frauenhandel",
    contact: "044 436 90 00",
    text: "Beratung und Schutz für Betroffene von Frauenhandel und Ausbeutung.",
  },
  {
    name: "ProCoRe / Aspasie",
    contact: "procore-info.ch",
    text: "Selbstorganisationen von Sexarbeitenden: Rechtsauskunft, Gesundheit, Beratung.",
  },
];

const RULES = [
  {
    icon: UserX,
    title: "Keine Minderjährigen",
    text: "Jedes Inserat wird vor der Freischaltung gegen ein amtliches Ausweisdokument geprüft. Bei Zweifeln sperren wir sofort und melden den Fall den Behörden.",
  },
  {
    icon: ShieldAlert,
    title: "Kein Zwang, keine Dritten",
    text: "Inserate dürfen nur von der anbietenden Person selbst oder mit deren nachgewiesener Zustimmung erstellt werden. Wer für andere inseriert, muss das offenlegen.",
  },
  {
    icon: FileCheck2,
    title: "Ehrliche Angaben",
    text: "Fotos müssen aktuell sein und die inserierende Person zeigen. Preise und Leistungen gelten wie beschrieben — beides ist Teil unserer Stichproben.",
  },
  {
    icon: Heart,
    title: "Respekt in beide Richtungen",
    text: "Beleidigende Nachrichten, Preisdrückerei nach Vertragsschluss und das Weiterverbreiten von Fotos führen zur dauerhaften Sperre des Kontos.",
  },
];

export default function Safety() {
  const [type, setType] = useState("");
  const [sent, setSent] = useState(false);

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    setSent(true);
    toast.success("Meldung erfasst. Wir prüfen sie innert einer Stunde.");
  };

  return (
    <div className="container-noira py-12">
      <p className="eyebrow mb-6">Sicherheit</p>
      <h1 className="display max-w-3xl text-[clamp(2.5rem,6vw,4.5rem)]">
        Erotik ist legal. <span className="text-gilded italic">Ausbeutung nicht.</span>
      </h1>
      <p className="mt-6 max-w-2xl leading-relaxed text-muted-foreground">
        Sexarbeit ist in der Schweiz eine anerkannte Erwerbstätigkeit — Zwang, Menschenhandel und
        Sex mit Minderjährigen sind Straftaten. NOIRA lebt von dieser Unterscheidung: Wir geben
        selbstbestimmt arbeitenden Menschen eine Bühne und entziehen allen anderen den Zugang.
      </p>

      {/* --- Soforthilfe --- */}
      <section className="mt-12 rounded-2xl border border-destructive/30 bg-destructive/5 p-7">
        <h2 className="display mb-2 flex items-center gap-3 text-2xl">
          <Phone className="h-5 w-5 text-destructive" strokeWidth={1.6} />
          Im Notfall
        </h2>
        <p className="mb-6 max-w-2xl text-sm leading-relaxed text-muted-foreground">
          Wenn eine Person in Gefahr ist, rufen Sie zuerst an und melden Sie danach das Inserat.
          Alle Stellen unten beraten kostenlos und auf Wunsch anonym.
        </p>
        <div className="grid gap-3 sm:grid-cols-2">
          {HELP.map((h) => (
            <div key={h.name} className="rounded-xl border border-line bg-surface/70 p-5">
              <p className="text-sm text-foreground">{h.name}</p>
              <p className="mt-1 font-mono text-lg text-gold">{h.contact}</p>
              <p className="mt-2 text-xs leading-relaxed text-muted-foreground">{h.text}</p>
            </div>
          ))}
        </div>
      </section>

      {/* --- Regeln --- */}
      <section className="mt-16">
        <div className="rule mb-12" />
        <p className="eyebrow mb-3">Hausordnung</p>
        <h2 className="display mb-10 text-3xl sm:text-4xl">Vier Regeln, keine Ausnahmen</h2>
        <div className="grid gap-4 md:grid-cols-2">
          {RULES.map((r) => (
            <div key={r.title} className="card-noir p-7">
              <r.icon className="mb-5 h-6 w-6 text-gold" strokeWidth={1.4} />
              <h3 className="display mb-2.5 text-2xl">{r.title}</h3>
              <p className="text-sm leading-relaxed text-muted-foreground">{r.text}</p>
            </div>
          ))}
        </div>
      </section>

      {/* --- Verifizierung --- */}
      <section className="mt-16">
        <div className="rule mb-12" />
        <div className="grid gap-10 lg:grid-cols-2">
          <div>
            <p className="eyebrow mb-3">Verifizierung</p>
            <h2 className="display mb-5 text-3xl sm:text-4xl">
              Was das Zeichen <BadgeCheck className="mb-1 inline h-7 w-7 text-verified" /> bedeutet
            </h2>
            <p className="mb-6 text-sm leading-relaxed text-muted-foreground">
              Verifizierte Inserate haben drei Prüfungen bestanden: Ausweisdokument, Selfie mit
              tagesaktuellem Codewort und Abgleich mit den hochgeladenen Fotos. Geprüft wird von
              Hand, nicht automatisch.
            </p>
            <ul className="space-y-3 text-sm text-muted-foreground">
              {[
                "Ausweiskopien werden verschlüsselt und getrennt vom Inserat gespeichert.",
                "Zugriff haben ausschliesslich zwei geschulte Personen im Prüfteam.",
                "90 Tage nach Ablauf des Inserats werden die Dokumente automatisch gelöscht.",
                "Das Zeichen ist nicht käuflich und erlischt bei falschen Angaben.",
              ].map((i) => (
                <li key={i} className="flex gap-2.5">
                  <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-verified" strokeWidth={1.6} />
                  {i}
                </li>
              ))}
            </ul>
          </div>

          {/* --- Meldeformular --- */}
          <div className="card-noir p-7">
            {sent ? (
              <div className="flex h-full flex-col items-center justify-center py-10 text-center">
                <ShieldCheck className="mb-5 h-10 w-10 text-verified" strokeWidth={1.3} />
                <h3 className="display mb-3 text-2xl">Meldung eingegangen</h3>
                <p className="max-w-sm text-sm leading-relaxed text-muted-foreground">
                  Unser Team prüft den Fall innert einer Stunde. Bei Hinweisen auf Zwang oder
                  Minderjährige deaktivieren wir das Inserat sofort und informieren die Behörden.
                </p>
                <button
                  onClick={() => setSent(false)}
                  className="mt-6 text-xs text-muted-foreground underline underline-offset-4 hover:text-foreground">
                  Weitere Meldung erfassen
                </button>
              </div>
            ) : (
              <form onSubmit={submit} className="space-y-4">
                <h3 className="display text-2xl">Inserat melden</h3>
                <p className="text-sm text-muted-foreground">
                  Anonym möglich — eine Kontaktangabe hilft uns nur bei Rückfragen.
                </p>

                <div>
                  <span className="mb-2 block text-xs text-muted-foreground">Worum geht es?</span>
                  <div className="grid gap-2 sm:grid-cols-2">
                    {[
                      "Verdacht auf Zwang",
                      "Vermutlich minderjährig",
                      "Fotos gestohlen / falsch",
                      "Betrug oder Abzocke",
                      "Belästigung",
                      "Anderes",
                    ].map((t) => (
                      <button
                        key={t}
                        type="button"
                        onClick={() => setType(t)}
                        className={cn(
                          "rounded-lg border px-3 py-2.5 text-left text-xs transition",
                          type === t
                            ? "border-gold bg-gold/10 text-foreground"
                            : "border-line text-muted-foreground hover:border-foreground/30",
                        )}>
                        {t}
                      </button>
                    ))}
                  </div>
                </div>

                <label className="block">
                  <span className="mb-1.5 block text-xs text-muted-foreground">
                    Inserat-Nummer oder Link
                  </span>
                  <input
                    placeholder="z. B. n-1042 oder noira.ch/inserat/…"
                    className="w-full rounded-lg border border-line bg-surface-2/60 px-4 py-3 text-sm focus:border-gold/60 focus:outline-none"
                  />
                </label>

                <label className="block">
                  <span className="mb-1.5 block text-xs text-muted-foreground">
                    Was ist passiert?
                  </span>
                  <textarea
                    required
                    rows={4}
                    placeholder="Beschreiben Sie die Beobachtung so genau wie möglich."
                    className="w-full resize-none rounded-lg border border-line bg-surface-2/60 px-4 py-3 text-sm focus:border-gold/60 focus:outline-none"
                  />
                </label>

                <label className="block">
                  <span className="mb-1.5 flex justify-between text-xs text-muted-foreground">
                    E-Mail <span className="text-muted-foreground/60">optional</span>
                  </span>
                  <input
                    type="email"
                    placeholder="nur für Rückfragen"
                    className="w-full rounded-lg border border-line bg-surface-2/60 px-4 py-3 text-sm focus:border-gold/60 focus:outline-none"
                  />
                </label>

                <button
                  type="submit"
                  className="w-full rounded-full bg-gold px-6 py-3.5 text-sm font-semibold text-ink transition hover:brightness-110">
                  Meldung absenden
                </button>
                <p className="text-center text-xs text-muted-foreground/70">
                  Bei akuter Gefahr bitte zuerst die 117 anrufen.
                </p>
              </form>
            )}
          </div>
        </div>
      </section>

      {/* --- Tipps --- */}
      <section className="mt-16">
        <div className="rule mb-12" />
        <div className="grid gap-4 md:grid-cols-2">
          <div className="card-noir p-7">
            <p className="eyebrow mb-4">Für Anbietende</p>
            <ul className="space-y-3 text-sm leading-relaxed text-muted-foreground">
              <li>— Sagen Sie jemandem, wo Sie sind und wann Sie sich zurückmelden.</li>
              <li>— Klären Sie Preis, Dauer und Grenzen vor dem Treffen, schriftlich.</li>
              <li>— Verlangen Sie keine Vorauszahlung per Link — seriöse Kundschaft auch nicht.</li>
              <li>— Ihre Rufnummer können Sie im Inserat verbergen und über uns weiterleiten.</li>
              <li>— Beratung und Gesundheitschecks bieten Aspasie, ProCoRe und die Kantone an.</li>
            </ul>
          </div>
          <div className="card-noir p-7">
            <p className="eyebrow mb-4">Für Suchende</p>
            <ul className="space-y-3 text-sm leading-relaxed text-muted-foreground">
              <li>— Bevorzugen Sie verifizierte Inserate; Betrug beginnt fast immer ohne Zeichen.</li>
              <li>— Zahlen Sie niemals im Voraus, nicht per Gutschein und nicht per Krypto.</li>
              <li>— Ein Nein gilt sofort und ohne Diskussion — auch mitten in einem Termin.</li>
              <li>— Wirkt eine Person unfrei, überwacht oder verängstigt: abbrechen und melden.</li>
              <li>— Fotos und Angaben zu Ihrem Gegenüber bleiben privat. Immer.</li>
            </ul>
          </div>
        </div>
      </section>
    </div>
  );
}
