/* ============================================================
   Inserieren — Pakete, Ablauf, Zahlung
   Die Preistabelle ist der Kern der Seite: Laufzeit umschalten,
   Paket wählen, direkt zur Kasse. Alles andere beantwortet nur
   die Fragen, die davor kommen.
   ============================================================ */

import { DURATIONS, PLANS, VAT_RATE, type PlanId } from "@/data/taxonomy";
import { chf } from "@/lib/format";
import { cn } from "@/lib/utils";
import {
  ArrowRight,
  BadgeCheck,
  Bitcoin,
  Check,
  CreditCard,
  EyeOff,
  FileText,
  Smartphone,
  Upload,
} from "lucide-react";
import { useState } from "react";
import { Link, useLocation } from "wouter";

const STEPS = [
  {
    icon: FileText,
    title: "Inserat schreiben",
    text: "Text, Services, Tarife und Erreichbarkeit erfassen. Alles bleibt später jederzeit änderbar.",
  },
  {
    icon: Upload,
    title: "Verifizieren",
    text: "Ausweis und ein Selfie mit Tages-Codewort hochladen. Wir prüfen von Hand, meist innert zwei Stunden.",
  },
  {
    icon: BadgeCheck,
    title: "Live gehen",
    text: "Nach der Zahlung erscheint Ihr Inserat sofort. Statistik zu Aufrufen und Kontakten inklusive.",
  },
];

const PAYMENT_INFO = [
  {
    icon: CreditCard,
    title: "Kreditkarte",
    text: "Visa, Mastercard und American Express. Auf der Abrechnung erscheint «NM DIGITAL GMBH» — kein Hinweis auf die Branche.",
  },
  {
    icon: Smartphone,
    title: "TWINT",
    text: "Bezahlen mit dem Schweizer Standard. QR scannen, bestätigen, fertig — ohne Kartendaten.",
  },
  {
    icon: Bitcoin,
    title: "Krypto",
    text: "Bitcoin, Ethereum oder USDT. Kurs 15 Minuten fixiert, Freischaltung nach der ersten Bestätigung.",
  },
];

export default function Advertise() {
  const [, navigate] = useLocation();
  const [duration, setDuration] = useState<7 | 30 | 90>(30);

  const goToCheckout = (plan: PlanId) =>
    navigate(`/inserat-erfassen?paket=${plan}&laufzeit=${duration}`);

  return (
    <>
      {/* ---------- Hero ---------- */}
      <section className="relative overflow-hidden py-16">
        <div className="aura -top-32 right-0 h-96 w-96" style={{ background: "#9A7434" }} />
        <div className="container-noira relative">
          <p className="eyebrow mb-6">Für Anbietende</p>
          <h1 className="display max-w-3xl text-[clamp(2.5rem,6vw,4.5rem)]">
            Sichtbar werden — <span className="text-gilded italic">ohne Umwege.</span>
          </h1>
          <p className="mt-6 max-w-xl leading-relaxed text-muted-foreground">
            Keine Provision auf Ihre Einnahmen, keine Vermittlung, keine Mindestlaufzeit über die
            gewählte Dauer hinaus. Sie zahlen für Sichtbarkeit — alles andere gehört Ihnen.
          </p>
          <div className="mt-9 flex flex-wrap gap-3">
            <a
              href="#preise"
              className="rounded-full bg-gold px-6 py-3.5 text-sm font-semibold text-ink transition hover:brightness-110">
              Paket wählen
            </a>
            <Link
              href="/sicherheit"
              className="rounded-full border border-line px-6 py-3.5 text-sm transition hover:border-gold/50">
              Wie wir Sie schützen
            </Link>
          </div>
        </div>
      </section>

      {/* ---------- Ablauf ---------- */}
      <section className="container-noira">
        <div className="rule mb-12" />
        <p className="eyebrow mb-3">In drei Schritten</p>
        <h2 className="display mb-10 text-3xl sm:text-4xl">So läuft es ab</h2>
        <div className="grid gap-4 md:grid-cols-3">
          {STEPS.map((s, i) => (
            <div key={s.title} className="card-noir p-7">
              <div className="mb-5 flex items-center justify-between">
                <s.icon className="h-6 w-6 text-gold" strokeWidth={1.4} />
                <span className="display text-4xl text-text-3">0{i + 1}</span>
              </div>
              <h3 className="display mb-2.5 text-2xl">{s.title}</h3>
              <p className="text-sm leading-relaxed text-muted-foreground">{s.text}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ---------- Preise ---------- */}
      <section id="preise" className="container-noira mt-24 scroll-mt-24">
        <div className="rule mb-12" />
        <div className="mb-10 flex flex-wrap items-end justify-between gap-6">
          <div>
            <p className="eyebrow mb-3">Preise</p>
            <h2 className="display text-3xl sm:text-4xl">Ein Paket, eine Laufzeit</h2>
            <p className="mt-2 text-sm text-muted-foreground">
              Alle Preise in CHF, zzgl. {(VAT_RATE * 100).toFixed(1).replace(".", ",")} % MWST.
            </p>
          </div>

          <div
            role="tablist"
            aria-label="Laufzeit"
            className="flex rounded-full border border-line p-1">
            {DURATIONS.map((d) => (
              <button
                key={d.days}
                role="tab"
                aria-selected={duration === d.days}
                onClick={() => setDuration(d.days)}
                className={cn(
                  "rounded-full px-5 py-2.5 text-sm transition",
                  duration === d.days
                    ? "bg-gold font-semibold text-ink"
                    : "text-muted-foreground hover:text-foreground",
                )}>
                {d.label}
              </button>
            ))}
          </div>
        </div>

        <div className="grid gap-4 lg:grid-cols-3">
          {PLANS.map((plan) => {
            const net = plan.price[duration];
            const perDay = net / duration;
            return (
              <div
                key={plan.id}
                className={cn(
                  "card-noir relative flex flex-col p-7",
                  plan.highlight && "ring-1 ring-gold/40",
                )}>
                {plan.highlight && (
                  <span className="absolute -top-3 left-7 rounded-full bg-gold px-3 py-1 font-mono text-[0.625rem] font-semibold tracking-widest text-ink uppercase">
                    Beliebt
                  </span>
                )}

                <h3 className="display text-3xl">{plan.name}</h3>
                <p className="mt-1.5 text-sm text-muted-foreground">{plan.tagline}</p>

                <div className="mt-7 flex items-baseline gap-2">
                  <span className="numeral text-5xl text-foreground">{chf(net, false)}</span>
                  <span className="text-sm text-muted-foreground">CHF / {duration} Tage</span>
                </div>
                <p className="mt-1.5 text-xs text-text-3">
                  entspricht {chf(Math.round(perDay * 100) / 100)} pro Tag · inkl. MWST{" "}
                  {chf(Math.round(net * (1 + VAT_RATE)))}
                </p>

                <ul className="mt-7 mb-8 flex-1 space-y-3 text-sm">
                  {plan.features.map((f) => (
                    <li key={f} className="flex gap-2.5 text-muted-foreground">
                      <Check className="mt-0.5 h-4 w-4 shrink-0 text-gold" strokeWidth={2} />
                      {f}
                    </li>
                  ))}
                </ul>

                <button
                  onClick={() => goToCheckout(plan.id)}
                  className={cn(
                    "flex items-center justify-center gap-2 rounded-full px-6 py-3.5 text-sm font-semibold transition",
                    plan.highlight
                      ? "bg-gold text-ink hover:brightness-110"
                      : "border border-line text-foreground hover:border-gold/50",
                  )}>
                  {plan.name} wählen <ArrowRight className="h-4 w-4" strokeWidth={2} />
                </button>
              </div>
            );
          })}
        </div>

        <p className="mt-6 text-center text-xs text-text-3">
          Clubs, Studios und Agenturen mit mehreren Profilen: Sammelrechnung auf Anfrage unter
          partner@noira.ch
        </p>
      </section>

      {/* ---------- Zahlung ---------- */}
      <section className="container-noira mt-24">
        <div className="rule mb-12" />
        <p className="eyebrow mb-3">Bezahlen</p>
        <h2 className="display mb-3 text-3xl sm:text-4xl">Diskret bis zur Abrechnung</h2>
        <p className="mb-10 max-w-xl text-sm leading-relaxed text-muted-foreground">
          Die Zahlungsart entscheidet, wie viel von Ihnen wir überhaupt sehen. Wer maximale
          Anonymität will, zahlt mit Krypto — dann brauchen wir nicht einmal einen Namen.
        </p>

        <div className="grid gap-4 md:grid-cols-3">
          {PAYMENT_INFO.map((p) => (
            <div key={p.title} className="card-noir p-7">
              <p.icon className="mb-5 h-6 w-6 text-gold" strokeWidth={1.4} />
              <h3 className="display mb-2.5 text-2xl">{p.title}</h3>
              <p className="text-sm leading-relaxed text-muted-foreground">{p.text}</p>
            </div>
          ))}
        </div>

        <div className="mt-4 flex gap-4 rounded-xl border border-line bg-surface/60 p-6">
          <EyeOff className="h-5 w-5 shrink-0 text-gold" strokeWidth={1.5} />
          <div className="text-sm leading-relaxed text-muted-foreground">
            <p className="mb-1.5 text-foreground">Was auf Ihrem Auszug steht</p>
            <p>
              Kreditkarte und TWINT: «NM DIGITAL GMBH, ZUERICH». Bei Krypto entsteht gar kein
              Eintrag bei Dritten. Rechnungen stellen wir auf Wunsch ohne Leistungsbeschrieb aus.
            </p>
          </div>
        </div>
      </section>

      {/* ---------- Abschluss ---------- */}
      <section className="container-noira mt-24 text-center">
        <div className="rule mb-14" />
        <h2 className="display mx-auto max-w-2xl text-4xl sm:text-5xl">
          Zwei Stunden bis zum <span className="text-gilded italic">ersten Anruf.</span>
        </h2>
        <button
          onClick={() => goToCheckout("plus")}
          className="mt-8 inline-flex items-center gap-2 rounded-full bg-gold px-8 py-4 text-sm font-semibold text-ink transition hover:brightness-110">
          Jetzt inserieren <ArrowRight className="h-4 w-4" strokeWidth={2} />
        </button>
      </section>
    </>
  );
}
