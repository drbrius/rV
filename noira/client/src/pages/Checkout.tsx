/* ============================================================
   Kasse — Kreditkarte, TWINT oder Krypto
   Ein Schritt, eine Spalte, rechts die mitlaufende Zusammen-
   fassung. Keine Konto-Pflicht: E-Mail genügt, bei Krypto
   reicht sogar eine Wegwerf-Adresse.

   HINWEIS FÜR DIE UMSETZUNG
   Diese Seite ist die vollständige Oberfläche, aber noch ohne
   Anbindung: Kartendaten würden in Produktion nie durch dieses
   Formular laufen, sondern über ein gehostetes Feld des PSP
   (Datatrans oder Stripe Elements) — damit bleibt der Betrieb
   ausserhalb des PCI-DSS-Geltungsbereichs. Krypto läuft über
   BTCPay Server oder Coinbase Commerce, TWINT über Datatrans.
   Die Prüfungen unten sind reine Eingabehilfen, keine Freigabe.
   ============================================================ */

import { DURATIONS, PLANS, VAT_RATE, type PlanId } from "@/data/taxonomy";
import { chf } from "@/lib/format";
import { cn } from "@/lib/utils";
import {
  ArrowLeft,
  Bitcoin,
  Check,
  ChevronDown,
  Copy,
  CreditCard,
  Lock,
  QrCode,
  ShieldCheck,
  Smartphone,
  Timer,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { Link, useLocation, useSearch } from "wouter";

type Method = "karte" | "twint" | "krypto";

/* Demo-Kurse. In Produktion liefert sie der Zahlungsanbieter mit
   einer Kursgarantie von 15 Minuten. */
const CRYPTO = [
  { id: "btc", name: "Bitcoin", ticker: "BTC", network: "Bitcoin", rate: 58_400, decimals: 6 },
  { id: "eth", name: "Ethereum", ticker: "ETH", network: "ERC-20", rate: 2_950, decimals: 5 },
  { id: "usdt", name: "Tether", ticker: "USDT", network: "TRC-20", rate: 0.88, decimals: 2 },
];

const DEMO_ADDRESS: Record<string, string> = {
  btc: "bc1q9noira0demo0adresse0nicht0verwenden0x7fz2",
  eth: "0xN01raDemoAdresse00000000000000000000c0de",
  usdt: "TNo1raDemoAdresse000000000000000000USDT",
};

const luhn = (digits: string) => {
  let sum = 0;
  let even = false;
  for (let i = digits.length - 1; i >= 0; i--) {
    let d = Number(digits[i]);
    if (even) {
      d *= 2;
      if (d > 9) d -= 9;
    }
    sum += d;
    even = !even;
  }
  return digits.length >= 13 && sum % 10 === 0;
};

const brandOf = (digits: string) => {
  if (/^4/.test(digits)) return "Visa";
  if (/^(5[1-5]|2[2-7])/.test(digits)) return "Mastercard";
  if (/^3[47]/.test(digits)) return "American Express";
  return "";
};

const groupCard = (raw: string) => {
  const d = raw.replace(/\D/g, "").slice(0, 19);
  return /^3[47]/.test(d)
    ? d.replace(/(\d{4})(\d{0,6})(\d{0,5})/, (_, a, b, c) => [a, b, c].filter(Boolean).join(" "))
    : (d.match(/.{1,4}/g)?.join(" ") ?? "");
};

function Field({
  label,
  hint,
  error,
  children,
}: {
  label: string;
  hint?: string;
  error?: string;
  children: React.ReactNode;
}) {
  return (
    <label className="block">
      <span className="mb-1.5 flex items-baseline justify-between text-xs text-muted-foreground">
        {label}
        {hint && <span className="text-muted-foreground/60">{hint}</span>}
      </span>
      {children}
      {error && <span className="mt-1 block text-xs text-destructive">{error}</span>}
    </label>
  );
}

const inputClass =
  "w-full rounded-lg border border-line bg-surface-2/60 px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground/60 focus:border-gold/60 focus:outline-none";

export default function Checkout() {
  const search = useSearch();
  const [, navigate] = useLocation();
  const params = new URLSearchParams(search);

  const [planId, setPlanId] = useState<PlanId>((params.get("paket") as PlanId) || "plus");
  const [duration, setDuration] = useState<7 | 30 | 90>(
    ([7, 30, 90] as const).includes(Number(params.get("laufzeit")) as never)
      ? (Number(params.get("laufzeit")) as 7 | 30 | 90)
      : 30,
  );

  const [method, setMethod] = useState<Method>("karte");
  const [email, setEmail] = useState("");
  const [card, setCard] = useState({ number: "", holder: "", expiry: "", cvc: "" });
  const [twintPhone, setTwintPhone] = useState("");
  const [asset, setAsset] = useState("btc");
  const [terms, setTerms] = useState(false);
  const [invoice, setInvoice] = useState(false);
  const [touched, setTouched] = useState(false);
  const [status, setStatus] = useState<"idle" | "pending" | "done">("idle");
  const [secondsLeft, setSecondsLeft] = useState(15 * 60);

  const plan = PLANS.find((p) => p.id === planId)!;
  const net = plan.price[duration];
  const vat = Math.round(net * VAT_RATE * 20) / 20; // auf 5 Rappen gerundet
  const total = net + vat;

  const coin = CRYPTO.find((c) => c.id === asset)!;
  const cryptoAmount = (total / coin.rate).toFixed(coin.decimals);

  // Kursgarantie läuft nur, solange Krypto gewählt und nicht bezahlt ist.
  useEffect(() => {
    if (method !== "krypto" || status === "done") return;
    setSecondsLeft(15 * 60);
    const t = setInterval(() => setSecondsLeft((s) => (s > 0 ? s - 1 : 0)), 1000);
    return () => clearInterval(t);
  }, [method, asset, status]);

  const errors = useMemo(() => {
    const e: Record<string, string> = {};
    if (!/^[^@\s]+@[^@\s]+\.[a-z]{2,}$/i.test(email)) e.email = "Bitte eine gültige E-Mail-Adresse.";
    if (method === "karte") {
      const digits = card.number.replace(/\D/g, "");
      if (!luhn(digits)) e.number = "Diese Kartennummer ist unvollständig oder falsch.";
      if (card.holder.trim().length < 3) e.holder = "Name wie auf der Karte.";
      const m = card.expiry.match(/^(\d{2})\s?\/?\s?(\d{2})$/);
      if (!m) e.expiry = "Format MM/JJ.";
      else {
        const month = Number(m[1]);
        const year = 2000 + Number(m[2]);
        const end = new Date(year, month, 0, 23, 59, 59);
        if (month < 1 || month > 12) e.expiry = "Monat zwischen 01 und 12.";
        else if (end < new Date()) e.expiry = "Karte ist abgelaufen.";
      }
      const cvcLen = brandOf(digits) === "American Express" ? 4 : 3;
      if (card.cvc.replace(/\D/g, "").length !== cvcLen) e.cvc = `${cvcLen} Ziffern.`;
    }
    if (method === "twint" && !/^(\+41|0)\s?7[5-9](\s?\d{3}){1}\s?\d{2}\s?\d{2}$/.test(twintPhone.trim()))
      e.twint = "Schweizer Mobilnummer, z. B. 079 123 45 67.";
    if (!terms) e.terms = "Bitte bestätigen Sie die Bedingungen.";
    return e;
  }, [email, method, card, twintPhone, terms]);

  const submit = (ev: React.FormEvent) => {
    ev.preventDefault();
    setTouched(true);
    if (Object.keys(errors).length) {
      toast.error("Bitte prüfen Sie die markierten Felder.");
      return;
    }
    setStatus("pending");
    // Platzhalter für den Redirect zum PSP (3-D Secure / TWINT-App / Wallet)
    setTimeout(() => setStatus("done"), 1400);
  };

  const err = (key: string) => (touched ? errors[key] : undefined);

  if (status === "done") {
    const orderId = `NO-${new Date().getFullYear()}-${Math.floor(100000 + Math.random() * 899999)}`;
    return (
      <div className="container-noira flex min-h-[70vh] items-center justify-center py-16">
        <div className="card-noir w-full max-w-lg p-9 text-center">
          <div className="mx-auto mb-6 flex h-14 w-14 items-center justify-center rounded-full bg-verified/15">
            <Check className="h-7 w-7 text-verified" strokeWidth={2} />
          </div>
          <h1 className="display mb-3 text-3xl">
            {method === "krypto" ? "Zahlung erkannt" : "Zahlung bestätigt"}
          </h1>
          <p className="mb-7 text-sm leading-relaxed text-muted-foreground">
            {method === "krypto"
              ? "Wir haben Ihre Transaktion im Netzwerk gesehen. Nach der ersten Bestätigung — meist unter 10 Minuten — schalten wir Ihr Inserat frei."
              : "Ihr Paket ist aktiv. Sie können Ihr Inserat jetzt erfassen; nach der Verifizierung erscheint es in der Suche."}
          </p>

          <dl className="mb-8 space-y-2.5 rounded-xl border border-line bg-surface-2/40 p-5 text-left text-sm">
            <div className="flex justify-between">
              <dt className="text-muted-foreground">Bestellnummer</dt>
              <dd className="font-mono text-foreground">{orderId}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-muted-foreground">Paket</dt>
              <dd className="text-foreground">
                {plan.name} · {duration} Tage
              </dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-muted-foreground">Betrag</dt>
              <dd className="text-foreground">
                {method === "krypto" ? `${cryptoAmount} ${coin.ticker}` : chf(total)}
              </dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-muted-foreground">Beleg an</dt>
              <dd className="text-foreground">{email}</dd>
            </div>
          </dl>

          <div className="flex flex-col gap-3 sm:flex-row">
            <button
              onClick={() => navigate("/werben")}
              className="flex-1 rounded-full bg-gold px-6 py-3.5 text-sm font-semibold text-ink transition hover:brightness-110">
              Inserat jetzt erfassen
            </button>
            <Link
              href="/"
              className="flex-1 rounded-full border border-line px-6 py-3.5 text-sm transition hover:border-gold/50">
              Zur Startseite
            </Link>
          </div>

          <p className="mt-6 text-xs text-muted-foreground/70">
            Auf Ihrer Abrechnung erscheint «NM DIGITAL GMBH, ZUERICH».
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="container-noira py-10">
      <Link
        href="/werben"
        className="mb-8 inline-flex items-center gap-2 text-sm text-muted-foreground transition hover:text-foreground">
        <ArrowLeft className="h-4 w-4" strokeWidth={1.6} /> Zurück zu den Paketen
      </Link>

      <p className="eyebrow mb-3">Kasse</p>
      <h1 className="display mb-10 text-4xl sm:text-5xl">Bestellung abschliessen</h1>

      <form onSubmit={submit} className="grid gap-8 lg:grid-cols-[1.4fr_1fr] lg:items-start">
        <div className="space-y-4">
          {/* --- 1. Paket --- */}
          <section className="card-noir p-6">
            <h2 className="mb-5 flex items-center gap-3 text-sm font-medium">
              <span className="flex h-6 w-6 items-center justify-center rounded-full border border-gold font-mono text-xs text-gold">
                1
              </span>
              Paket und Laufzeit
            </h2>

            <div className="grid gap-3 sm:grid-cols-3">
              {PLANS.map((p) => (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => setPlanId(p.id)}
                  className={cn(
                    "rounded-xl border p-4 text-left transition",
                    planId === p.id
                      ? "border-gold bg-gold/8"
                      : "border-line hover:border-foreground/30",
                  )}>
                  <span className="block text-sm font-medium text-foreground">{p.name}</span>
                  <span className="mt-1 block text-xs text-muted-foreground">
                    {chf(p.price[duration])} / {duration} T.
                  </span>
                </button>
              ))}
            </div>

            <div className="mt-3 grid gap-3 sm:grid-cols-3">
              {DURATIONS.map((d) => (
                <button
                  key={d.days}
                  type="button"
                  onClick={() => setDuration(d.days)}
                  className={cn(
                    "rounded-xl border p-4 text-left transition",
                    duration === d.days
                      ? "border-gold bg-gold/8"
                      : "border-line hover:border-foreground/30",
                  )}>
                  <span className="block text-sm font-medium text-foreground">{d.label}</span>
                  <span className="mt-1 block text-xs text-muted-foreground">{d.note}</span>
                </button>
              ))}
            </div>
          </section>

          {/* --- 2. Kontakt --- */}
          <section className="card-noir p-6">
            <h2 className="mb-5 flex items-center gap-3 text-sm font-medium">
              <span className="flex h-6 w-6 items-center justify-center rounded-full border border-gold font-mono text-xs text-gold">
                2
              </span>
              Kontakt für den Beleg
            </h2>

            <Field label="E-Mail" hint="für Beleg und Zugang" error={err("email")}>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="name@beispiel.ch"
                autoComplete="email"
                className={inputClass}
              />
            </Field>

            <label className="mt-4 flex cursor-pointer items-start gap-2.5 text-sm text-muted-foreground">
              <input
                type="checkbox"
                checked={invoice}
                onChange={(e) => setInvoice(e.target.checked)}
                className="mt-0.5 h-4 w-4 accent-[color:var(--noira-gold)]"
              />
              Rechnung mit Firmenadresse benötigt (ohne Leistungsbeschrieb)
            </label>

            {invoice && (
              <div className="mt-4 grid gap-3 sm:grid-cols-2">
                <input placeholder="Firma / Name" className={inputClass} />
                <input placeholder="Strasse und Nr." className={inputClass} />
                <input placeholder="PLZ" className={inputClass} />
                <input placeholder="Ort" className={inputClass} />
              </div>
            )}
          </section>

          {/* --- 3. Zahlung --- */}
          <section className="card-noir p-6">
            <h2 className="mb-5 flex items-center gap-3 text-sm font-medium">
              <span className="flex h-6 w-6 items-center justify-center rounded-full border border-gold font-mono text-xs text-gold">
                3
              </span>
              Zahlungsart
            </h2>

            <div role="tablist" className="mb-6 grid grid-cols-3 gap-2">
              {(
                [
                  { id: "karte", label: "Kreditkarte", icon: CreditCard },
                  { id: "twint", label: "TWINT", icon: Smartphone },
                  { id: "krypto", label: "Krypto", icon: Bitcoin },
                ] as const
              ).map((m) => (
                <button
                  key={m.id}
                  type="button"
                  role="tab"
                  aria-selected={method === m.id}
                  onClick={() => setMethod(m.id)}
                  className={cn(
                    "flex flex-col items-center gap-2 rounded-xl border px-3 py-4 text-xs transition sm:flex-row sm:justify-center sm:text-sm",
                    method === m.id
                      ? "border-gold bg-gold/8 text-foreground"
                      : "border-line text-muted-foreground hover:border-foreground/30",
                  )}>
                  <m.icon className="h-4 w-4" strokeWidth={1.6} />
                  {m.label}
                </button>
              ))}
            </div>

            {/* Kreditkarte */}
            {method === "karte" && (
              <div className="space-y-4">
                <Field
                  label="Kartennummer"
                  hint={brandOf(card.number.replace(/\D/g, "")) || undefined}
                  error={err("number")}>
                  <div className="relative">
                    <input
                      inputMode="numeric"
                      autoComplete="cc-number"
                      value={card.number}
                      onChange={(e) => setCard({ ...card, number: groupCard(e.target.value) })}
                      placeholder="4242 4242 4242 4242"
                      className={cn(inputClass, "pr-12 font-mono tracking-wider")}
                    />
                    <CreditCard
                      className="pointer-events-none absolute top-1/2 right-4 h-4 w-4 -translate-y-1/2 text-muted-foreground"
                      strokeWidth={1.6}
                    />
                  </div>
                </Field>

                <Field label="Karteninhaber" error={err("holder")}>
                  <input
                    autoComplete="cc-name"
                    value={card.holder}
                    onChange={(e) => setCard({ ...card, holder: e.target.value })}
                    placeholder="M. MUSTER"
                    className={cn(inputClass, "uppercase")}
                  />
                </Field>

                <div className="grid grid-cols-2 gap-3">
                  <Field label="Gültig bis" hint="MM/JJ" error={err("expiry")}>
                    <input
                      inputMode="numeric"
                      autoComplete="cc-exp"
                      value={card.expiry}
                      onChange={(e) => {
                        const d = e.target.value.replace(/\D/g, "").slice(0, 4);
                        setCard({
                          ...card,
                          expiry: d.length > 2 ? `${d.slice(0, 2)}/${d.slice(2)}` : d,
                        });
                      }}
                      placeholder="08/28"
                      className={cn(inputClass, "font-mono")}
                    />
                  </Field>
                  <Field label="Prüfziffer" hint="Rückseite" error={err("cvc")}>
                    <input
                      inputMode="numeric"
                      autoComplete="cc-csc"
                      value={card.cvc}
                      onChange={(e) =>
                        setCard({ ...card, cvc: e.target.value.replace(/\D/g, "").slice(0, 4) })
                      }
                      placeholder="123"
                      className={cn(inputClass, "font-mono")}
                    />
                  </Field>
                </div>

                <p className="flex items-start gap-2 text-xs leading-relaxed text-muted-foreground/80">
                  <Lock className="mt-0.5 h-3.5 w-3.5 shrink-0" strokeWidth={1.6} />
                  Die Zahlung wird über einen Schweizer Zahlungsdienstleister mit 3-D Secure
                  abgewickelt. Kartendaten werden nicht bei NOIRA gespeichert.
                </p>
              </div>
            )}

            {/* TWINT */}
            {method === "twint" && (
              <div className="space-y-4">
                <Field label="Mobilnummer" hint="mit TWINT verknüpft" error={err("twint")}>
                  <input
                    inputMode="tel"
                    value={twintPhone}
                    onChange={(e) => setTwintPhone(e.target.value)}
                    placeholder="079 123 45 67"
                    className={cn(inputClass, "font-mono")}
                  />
                </Field>
                <div className="flex gap-4 rounded-xl border border-line bg-surface-2/40 p-5">
                  <QrCode className="h-8 w-8 shrink-0 text-gold" strokeWidth={1.3} />
                  <p className="text-xs leading-relaxed text-muted-foreground">
                    Nach dem Bestätigen erhalten Sie eine Zahlungsanfrage in Ihrer TWINT-App. Am
                    Desktop erscheint stattdessen ein QR-Code zum Scannen. Die Freigabe ist 5
                    Minuten gültig.
                  </p>
                </div>
              </div>
            )}

            {/* Krypto */}
            {method === "krypto" && (
              <div className="space-y-4">
                <div className="grid gap-2 sm:grid-cols-3">
                  {CRYPTO.map((c) => (
                    <button
                      key={c.id}
                      type="button"
                      onClick={() => setAsset(c.id)}
                      className={cn(
                        "rounded-xl border p-4 text-left transition",
                        asset === c.id
                          ? "border-gold bg-gold/8"
                          : "border-line hover:border-foreground/30",
                      )}>
                      <span className="block text-sm font-medium text-foreground">{c.ticker}</span>
                      <span className="mt-0.5 block text-xs text-muted-foreground">
                        {c.name} · {c.network}
                      </span>
                    </button>
                  ))}
                </div>

                <div className="rounded-xl border border-line bg-surface-2/40 p-5">
                  <div className="mb-4 flex items-baseline justify-between gap-3">
                    <span className="text-xs text-muted-foreground">Zu überweisen</span>
                    <span className="display text-2xl text-gold">
                      {cryptoAmount} {coin.ticker}
                    </span>
                  </div>

                  <div className="mb-4">
                    <span className="mb-1.5 block text-xs text-muted-foreground">
                      Empfängeradresse ({coin.network})
                    </span>
                    <div className="flex items-center gap-2 rounded-lg border border-line bg-ink/60 px-3 py-2.5">
                      <code className="flex-1 truncate font-mono text-xs text-foreground">
                        {DEMO_ADDRESS[asset]}
                      </code>
                      <button
                        type="button"
                        onClick={() => {
                          navigator.clipboard?.writeText(DEMO_ADDRESS[asset]);
                          toast.success("Adresse kopiert");
                        }}
                        className="shrink-0 rounded-md p-1.5 transition hover:bg-surface-2"
                        aria-label="Adresse kopieren">
                        <Copy className="h-3.5 w-3.5" strokeWidth={1.6} />
                      </button>
                    </div>
                  </div>

                  <p className="flex items-center gap-2 text-xs text-muted-foreground">
                    <Timer className="h-3.5 w-3.5 text-gold" strokeWidth={1.6} />
                    Kurs fixiert für{" "}
                    <span className="font-mono text-foreground">
                      {String(Math.floor(secondsLeft / 60)).padStart(2, "0")}:
                      {String(secondsLeft % 60).padStart(2, "0")}
                    </span>
                    — 1 {coin.ticker} = {chf(coin.rate)}
                  </p>

                  <p className="mt-3 text-xs leading-relaxed text-muted-foreground/70">
                    Senden Sie ausschliesslich über das angegebene Netzwerk. Der QR-Code für Ihre
                    Wallet erscheint nach dem Bestätigen; die Freischaltung erfolgt nach der ersten
                    Netzwerkbestätigung.
                  </p>
                </div>
              </div>
            )}
          </section>
        </div>

        {/* --- Zusammenfassung --- */}
        <aside className="lg:sticky lg:top-24">
          <div className="card-noir p-6">
            <h2 className="display mb-5 text-2xl">Übersicht</h2>

            <dl className="space-y-3 text-sm">
              <div className="flex justify-between gap-4">
                <dt className="text-muted-foreground">
                  Paket {plan.name}
                  <span className="block text-xs text-muted-foreground/60">
                    {duration} Tage · bis zu {plan.photos} Fotos
                  </span>
                </dt>
                <dd className="text-foreground">{chf(net)}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-muted-foreground">
                  MWST {(VAT_RATE * 100).toFixed(1).replace(".", ",")} %
                </dt>
                <dd className="text-foreground">{chf(vat)}</dd>
              </div>
            </dl>

            <div className="rule my-5" />

            <div className="flex items-baseline justify-between">
              <span className="text-sm text-muted-foreground">Total</span>
              <span className="display text-3xl text-gold">{chf(total)}</span>
            </div>
            {method === "krypto" && (
              <p className="mt-1 text-right text-xs text-muted-foreground">
                ≈ {cryptoAmount} {coin.ticker}
              </p>
            )}

            <label className="mt-6 flex cursor-pointer items-start gap-2.5 text-xs leading-relaxed text-muted-foreground">
              <input
                type="checkbox"
                checked={terms}
                onChange={(e) => setTerms(e.target.checked)}
                className="mt-0.5 h-4 w-4 shrink-0 accent-[color:var(--noira-gold)]"
              />
              <span>
                Ich bin mindestens 18 Jahre alt, handle selbstbestimmt und akzeptiere die{" "}
                <Link href="/agb" className="text-gold-soft underline underline-offset-2">
                  AGB
                </Link>{" "}
                sowie die{" "}
                <Link href="/datenschutz" className="text-gold-soft underline underline-offset-2">
                  Datenschutzerklärung
                </Link>
                .
              </span>
            </label>
            {err("terms") && <p className="mt-1.5 text-xs text-destructive">{errors.terms}</p>}

            <button
              type="submit"
              disabled={status === "pending"}
              className="mt-5 flex w-full items-center justify-center gap-2 rounded-full bg-gold px-6 py-4 text-sm font-semibold text-ink transition hover:brightness-110 disabled:opacity-60">
              {status === "pending" ? (
                <>
                  <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-ink/30 border-t-ink" />
                  Wird verarbeitet …
                </>
              ) : (
                <>
                  <Lock className="h-4 w-4" strokeWidth={2} />
                  {method === "krypto" ? "Zahlung starten" : `${chf(total)} bezahlen`}
                </>
              )}
            </button>

            <ul className="mt-5 space-y-2 text-xs text-muted-foreground/80">
              <li className="flex items-center gap-2">
                <ShieldCheck className="h-3.5 w-3.5 shrink-0 text-verified" strokeWidth={1.6} />
                Neutrale Bezeichnung auf der Abrechnung
              </li>
              <li className="flex items-center gap-2">
                <Lock className="h-3.5 w-3.5 shrink-0 text-verified" strokeWidth={1.6} />
                TLS-verschlüsselt, Server in der Schweiz
              </li>
              <li className="flex items-center gap-2">
                <ChevronDown className="h-3.5 w-3.5 shrink-0 rotate-[-90deg]" strokeWidth={1.6} />
                Kein Abo — die Laufzeit endet automatisch
              </li>
            </ul>
          </div>

          <p className="mt-4 px-2 text-xs leading-relaxed text-muted-foreground/60">
            Demo-Umgebung: Es wird keine echte Zahlung ausgelöst und keine Kartendaten übermittelt.
          </p>
        </aside>
      </form>
    </div>
  );
}
