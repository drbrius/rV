/* ============================================================
   Inserat erfassen
   Vier Schritte, rechts eine Vorschau, die bei jeder Eingabe
   mitwächst. Wer inseriert, soll nicht raten müssen, wie das
   Ergebnis aussieht — die Karte in der Trefferliste ist das
   Produkt, nicht das Formular.

   Der Entwurf liegt in localStorage: Wer mitten im Erfassen
   unterbrochen wird, verliert nichts. Fotos bleiben davon
   ausgenommen — Dateien lassen sich nicht serialisieren und
   gehören ohnehin erst nach der Zahlung auf einen Server.
   ============================================================ */

import { ListingCard } from "@/components/ListingCard";
import type { Listing } from "@/data/listings";
import {
  CANTONS,
  CATEGORIES,
  LANGUAGES,
  SERVICES,
  type CategoryId,
} from "@/data/taxonomy";
import { cn } from "@/lib/utils";
import {
  ArrowLeft,
  ArrowRight,
  BadgeCheck,
  Check,
  ChevronDown,
  Eye,
  ImagePlus,
  Info,
  Lock,
  ShieldCheck,
  Trash2,
  X,
} from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { toast } from "sonner";
import { Link, useLocation, useSearch } from "wouter";

const DRAFT_KEY = "noira.draft.v2";
const MAX_PHOTOS = 15;
const TAGLINE_MAX = 80;
const ABOUT_MAX = 1200;

type Draft = {
  name: string;
  age: string;
  category: CategoryId | "";
  canton: string;
  city: string;
  languages: string[];
  tagline: string;
  about: string;
  services: string[];
  incall: boolean;
  outcall: boolean;
  rates: { m30: string; h1: string; h2: string; night: string };
  availability: string;
  phone: string;
  hidePhone: boolean;
};

const EMPTY: Draft = {
  name: "",
  age: "",
  category: "",
  canton: "",
  city: "",
  languages: [],
  tagline: "",
  about: "",
  services: [],
  incall: true,
  outcall: false,
  rates: { m30: "", h1: "", h2: "", night: "" },
  availability: "",
  phone: "",
  hidePhone: false,
};

const STEPS = [
  { title: "Wer Sie sind", hint: "Name, Alter, Region" },
  { title: "Was Sie anbieten", hint: "Text und Services" },
  { title: "Was es kostet", hint: "Tarife und Zeiten" },
  { title: "Fotos & Verifizierung", hint: "Bilder und Ausweis" },
];

/* Das Codewort wechselt täglich und muss auf dem Verifizierungs-Selfie
   sichtbar sein. In Produktion kommt es serverseitig und pro Konto —
   hier deterministisch aus dem Datum, damit die Demo stabil bleibt. */
function codewordOfDay(d = new Date()) {
  const WORDS = [
    "ALPENGLÜHEN", "NACHTBLAU", "SEIDENPAPIER", "GOLDREGEN", "FLUSSKIESEL",
    "MONDSICHEL", "TANNENHARZ", "SAMTHANDSCHUH", "WINTERLICHT", "GLASPERLE",
  ];
  const day = Math.floor(d.getTime() / 86_400_000);
  return WORDS[day % WORDS.length];
}

const inputClass =
  "w-full rounded-lg border border-line bg-surface-2/60 px-4 py-3 text-sm text-foreground placeholder:text-text-3 focus:border-gold/60 focus:outline-none";

/**
 * Beschriftetes Feld. `group` ist keine Kosmetik: Ein <label> darf genau
 * ein Bedienelement umschliessen. Um eine Reihe von Chips gelegt, erben
 * alle Chips den Text der ganzen Gruppe als Namen — Screenreader lesen
 * dann bei jedem Chip die komplette Liste vor. Gruppen bekommen darum
 * <fieldset>/<legend>.
 */
function Field({
  label,
  hint,
  error,
  group,
  children,
}: {
  label: string;
  hint?: string;
  error?: string;
  group?: boolean;
  children: React.ReactNode;
}) {
  const caption = (
    <>
      {label}
      {hint && <span className="text-text-3">{hint}</span>}
    </>
  );
  const captionClass =
    "mb-1.5 flex w-full items-baseline justify-between gap-3 text-xs text-muted-foreground";

  if (group) {
    return (
      <fieldset className="block">
        <legend className={captionClass}>{caption}</legend>
        {children}
        {error && <span className="mt-1 block text-xs text-destructive">{error}</span>}
      </fieldset>
    );
  }

  return (
    <label className="block">
      <span className={captionClass}>{caption}</span>
      {children}
      {error && <span className="mt-1 block text-xs text-destructive">{error}</span>}
    </label>
  );
}

function Chip({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={cn(
        "rounded-full border px-3.5 py-2 text-xs transition",
        active
          ? "border-gold bg-gold/12 text-foreground"
          : "border-line text-muted-foreground hover:border-foreground/30",
      )}>
      {children}
    </button>
  );
}

/** Ein Upload-Feld mit Vorschau. Dateien bleiben im Browser. */
function DropZone({
  label,
  note,
  file,
  onPick,
  onClear,
}: {
  label: string;
  note: string;
  file: { url: string; name: string } | null;
  onPick: (f: File) => void;
  onClear: () => void;
}) {
  const ref = useRef<HTMLInputElement>(null);

  return (
    <div className="rounded-xl border border-dashed border-line p-4">
      <p className="mb-1 text-sm text-foreground">{label}</p>
      <p className="mb-3 text-xs leading-relaxed text-muted-foreground">{note}</p>

      {file ? (
        <div className="flex items-center gap-3 rounded-lg border border-line bg-surface-2/50 p-2.5">
          <img src={file.url} alt="" className="h-12 w-12 rounded object-cover" />
          <span className="flex-1 truncate text-xs text-muted-foreground">{file.name}</span>
          <button
            type="button"
            onClick={onClear}
            className="rounded-md p-1.5 text-muted-foreground transition hover:text-destructive"
            aria-label="Datei entfernen">
            <Trash2 className="h-4 w-4" strokeWidth={1.6} />
          </button>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => ref.current?.click()}
          className="flex w-full items-center justify-center gap-2 rounded-lg border border-line py-3 text-xs text-muted-foreground transition hover:border-gold/50 hover:text-foreground">
          <ImagePlus className="h-4 w-4" strokeWidth={1.6} />
          Datei wählen
        </button>
      )}

      <input
        ref={ref}
        type="file"
        accept="image/*"
        className="sr-only"
        onChange={(e) => {
          const f = e.target.files?.[0];
          if (f) onPick(f);
          e.target.value = "";
        }}
      />
    </div>
  );
}

export default function Compose() {
  const [, navigate] = useLocation();
  // Paket und Laufzeit werden von /werben durchgereicht und am Ende
  // unverändert an die Kasse weitergegeben.
  const search = useSearch();
  const [step, setStep] = useState(0);
  const [touched, setTouched] = useState<Record<number, boolean>>({});
  const [draft, setDraft] = useState<Draft>(() => {
    try {
      const raw = localStorage.getItem(DRAFT_KEY);
      return raw ? { ...EMPTY, ...(JSON.parse(raw) as Partial<Draft>) } : EMPTY;
    } catch {
      return EMPTY;
    }
  });

  const [photos, setPhotos] = useState<{ url: string; name: string }[]>([]);
  const [idDoc, setIdDoc] = useState<{ url: string; name: string } | null>(null);
  const [selfie, setSelfie] = useState<{ url: string; name: string } | null>(null);
  const [mobilePreview, setMobilePreview] = useState(false);
  const photoInput = useRef<HTMLInputElement>(null);
  const codeword = useMemo(() => codewordOfDay(), []);

  const set = (patch: Partial<Draft>) => setDraft((d) => ({ ...d, ...patch }));

  useEffect(() => {
    try {
      localStorage.setItem(DRAFT_KEY, JSON.stringify(draft));
    } catch {
      /* Privater Modus: dann eben ohne Zwischenspeicher */
    }
  }, [draft]);

  // Object-URLs freigeben, sonst hält der Browser die Bilder im Speicher.
  useEffect(
    () => () => {
      [...photos, idDoc, selfie].forEach((f) => f && URL.revokeObjectURL(f.url));
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [],
  );

  const toggle = (key: "languages" | "services", value: string) => {
    const cur = draft[key];
    set({ [key]: cur.includes(value) ? cur.filter((v) => v !== value) : [...cur, value] } as never);
  };

  const addPhotos = (files: FileList) => {
    const room = MAX_PHOTOS - photos.length;
    if (room <= 0) {
      toast.error(`Mehr als ${MAX_PHOTOS} Fotos sind im gewählten Paket nicht möglich.`);
      return;
    }
    const picked = Array.from(files).slice(0, room);
    setPhotos((p) => [
      ...p,
      ...picked.map((f) => ({ url: URL.createObjectURL(f), name: f.name })),
    ]);
    if (files.length > room) toast.info(`${files.length - room} Fotos wurden nicht übernommen.`);
  };

  /* --- Prüfung je Schritt ---------------------------------------- */
  const errorsByStep = useMemo(() => {
    const s0: Record<string, string> = {};
    if (draft.name.trim().length < 2) s0.name = "Bitte einen Namen angeben.";
    const age = Number(draft.age);
    if (!draft.age) s0.age = "Pflichtangabe.";
    else if (!Number.isInteger(age) || age < 18 || age > 99)
      s0.age = "Nur volljährige Personen dürfen inserieren.";
    if (!draft.category) s0.category = "Bitte eine Kategorie wählen.";
    if (!draft.canton) s0.canton = "Bitte eine Region wählen.";
    if (draft.city.trim().length < 2) s0.city = "Bitte den Ort angeben.";
    if (draft.languages.length === 0) s0.languages = "Mindestens eine Sprache.";

    const s1: Record<string, string> = {};
    if (draft.tagline.trim().length < 10) s1.tagline = "Mindestens 10 Zeichen.";
    if (draft.about.trim().length < 80) s1.about = "Mindestens 80 Zeichen — das liest sich sonst wie eine Anzeige von 2004.";
    if (draft.services.length === 0) s1.services = "Mindestens ein Angebot.";
    if (!draft.incall && !draft.outcall) s1.place = "Empfang, Besuche oder beides — eines davon.";

    const s2: Record<string, string> = {};
    const h1 = Number(draft.rates.h1);
    if (!draft.rates.h1) s2.h1 = "Der Stundentarif ist Pflicht.";
    else if (!(h1 >= 20 && h1 <= 5000)) s2.h1 = "Bitte einen Betrag zwischen 20 und 5000.";
    if (draft.availability.trim().length < 3) s2.availability = "Wann sind Sie erreichbar?";
    if (!/^(\+41|0)[\s\d]{9,}$/.test(draft.phone.trim()))
      s2.phone = "Schweizer Nummer, z. B. 079 123 45 67.";

    const s3: Record<string, string> = {};
    if (photos.length === 0) s3.photos = "Mindestens ein Foto.";
    if (!idDoc) s3.idDoc = "Ohne Ausweis keine Freischaltung.";
    if (!selfie) s3.selfie = "Selfie mit dem Codewort von heute.";

    return [s0, s1, s2, s3];
  }, [draft, photos, idDoc, selfie]);

  const err = (s: number, key: string) => (touched[s] ? errorsByStep[s][key] : undefined);
  const stepComplete = (s: number) => Object.keys(errorsByStep[s]).length === 0;

  const go = (to: number) => {
    // Vorwärts nur mit vollständigem Schritt; zurück immer.
    if (to > step && !stepComplete(step)) {
      setTouched((t) => ({ ...t, [step]: true }));
      toast.error("Bitte die markierten Felder ergänzen.");
      return;
    }
    setTouched((t) => ({ ...t, [step]: true }));
    setStep(to);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const finish = () => {
    if (!stepComplete(3)) {
      setTouched((t) => ({ ...t, 3: true }));
      toast.error("Fotos und Verifizierung fehlen noch.");
      return;
    }
    toast.success("Entwurf gespeichert — weiter zur Bezahlung.");
    const params = new URLSearchParams(search);
    if (!params.get("paket")) params.set("paket", "plus");
    if (!params.get("laufzeit")) params.set("laufzeit", "30");
    navigate(`/kasse?${params}`);
  };

  /* --- Vorschau ---------------------------------------------------- */
  const preview: Listing = {
    id: "n-neu",
    slug: "vorschau",
    name: draft.name.trim() || "Ihr Name",
    age: Number(draft.age) || 0,
    category: (draft.category || "begleitung") as CategoryId,
    canton: draft.canton || "ZH",
    city: draft.city.trim() || "Ihre Stadt",
    tagline: draft.tagline.trim() || "Ihr Einzeiler erscheint hier — der erste Satz entscheidet.",
    about: draft.about,
    services: draft.services as never,
    languages: draft.languages as never,
    rates: {
      m30: draft.rates.m30 ? Number(draft.rates.m30) : undefined,
      h1: Number(draft.rates.h1) || 0,
      h2: Number(draft.rates.h2) || 0,
      night: draft.rates.night ? Number(draft.rates.night) : undefined,
    },
    incall: draft.incall,
    outcall: draft.outcall,
    verified: Boolean(idDoc && selfie),
    premium: false,
    hasVideo: false,
    online: true,
    photos: photos.length,
    views: 0,
    published: new Date().toISOString().slice(0, 10),
    availability: draft.availability,
    phone: draft.phone,
    motif: draft.name.length % 6,
  };

  const previewPanel = (
    <div>
      <p className="eyebrow mb-4">So sehen andere Sie</p>
      <div className="max-w-72">
        <ListingCard listing={preview} imageUrl={photos[0]?.url} asPreview />
      </div>
      <ul className="mt-6 space-y-2.5 text-xs text-muted-foreground">
        <li className="flex items-start gap-2">
          <BadgeCheck
            className={cn(
              "mt-px h-4 w-4 shrink-0",
              preview.verified ? "text-verified" : "text-text-3",
            )}
            strokeWidth={1.6}
          />
          {preview.verified
            ? "Verifiziert — nach unserer Prüfung sichtbar"
            : "Ohne Ausweis und Selfie kein Prüfzeichen"}
        </li>
        <li className="flex items-start gap-2">
          <Eye className="mt-px h-4 w-4 shrink-0" strokeWidth={1.6} />
          {photos.length} von {MAX_PHOTOS} Fotos
        </li>
        <li className="flex items-start gap-2">
          <Lock className="mt-px h-4 w-4 shrink-0" strokeWidth={1.6} />
          {draft.hidePhone
            ? "Nummer verborgen, Anrufe laufen über NOIRA"
            : "Nummer wird auf Klick angezeigt"}
        </li>
      </ul>
    </div>
  );

  return (
    <div className="container-noira py-10">
      <Link
        href="/werben"
        className="mb-8 inline-flex items-center gap-2 text-sm text-muted-foreground transition hover:text-foreground">
        <ArrowLeft className="h-4 w-4" strokeWidth={1.6} /> Zurück zu den Paketen
      </Link>

      <p className="eyebrow mb-3">Inserat erfassen</p>
      <h1 className="display mb-3 text-4xl sm:text-5xl">Ihr Inserat entsteht</h1>
      <p className="mb-10 max-w-xl text-sm leading-relaxed text-muted-foreground">
        Alles hier lässt sich später jederzeit ändern. Ihr Entwurf wird automatisch in diesem
        Browser gespeichert — Sie können jederzeit unterbrechen und weitermachen.
      </p>

      {/* --- Schrittleiste --- */}
      <ol className="mb-10 grid gap-2 sm:grid-cols-4">
        {STEPS.map((s, i) => {
          const done = stepComplete(i) && i < step;
          return (
            <li key={s.title}>
              <button
                onClick={() => go(i)}
                className={cn(
                  "flex w-full items-center gap-3 rounded-xl border p-4 text-left transition",
                  i === step
                    ? "border-gold bg-gold/8"
                    : "border-line hover:border-foreground/30",
                )}>
                <span
                  className={cn(
                    "flex h-7 w-7 shrink-0 items-center justify-center rounded-full border font-mono text-xs",
                    done
                      ? "border-verified bg-verified/15 text-verified"
                      : i === step
                        ? "border-gold text-gold"
                        : "border-line text-muted-foreground",
                  )}>
                  {done ? <Check className="h-3.5 w-3.5" strokeWidth={2.5} /> : i + 1}
                </span>
                <span className="min-w-0">
                  <span className="block truncate text-sm text-foreground">{s.title}</span>
                  <span className="block truncate text-xs text-muted-foreground">{s.hint}</span>
                </span>
              </button>
            </li>
          );
        })}
      </ol>

      <div className="grid gap-10 lg:grid-cols-[1fr_20rem] lg:items-start">
        <div className="card-noir p-6 sm:p-8">
          {/* ---------- Schritt 1 ---------- */}
          {step === 0 && (
            <div className="space-y-5">
              <div className="grid gap-4 sm:grid-cols-[2fr_1fr]">
                <Field label="Name oder Künstlername" error={err(0, "name")}>
                  <input
                    value={draft.name}
                    onChange={(e) => set({ name: e.target.value })}
                    placeholder="Wie sollen Sie genannt werden?"
                    className={inputClass}
                  />
                </Field>
                <Field label="Alter" hint="ab 18" error={err(0, "age")}>
                  <input
                    inputMode="numeric"
                    value={draft.age}
                    onChange={(e) => set({ age: e.target.value.replace(/\D/g, "").slice(0, 2) })}
                    placeholder="27"
                    className={inputClass}
                  />
                </Field>
              </div>

              <Field label="Kategorie" group error={err(0, "category")}>
                <div className="flex flex-wrap gap-2">
                  {CATEGORIES.map((c) => (
                    <Chip
                      key={c.id}
                      active={draft.category === c.id}
                      onClick={() => set({ category: c.id })}>
                      {c.short}
                    </Chip>
                  ))}
                </div>
              </Field>

              <div className="grid gap-4 sm:grid-cols-2">
                <Field label="Region" error={err(0, "canton")}>
                  <div className="relative">
                    <select
                      value={draft.canton}
                      onChange={(e) => set({ canton: e.target.value })}
                      className={cn(inputClass, "appearance-none pr-10")}>
                      <option value="">Kanton wählen</option>
                      {CANTONS.map((c) => (
                        <option key={c.code} value={c.code}>
                          {c.name}
                        </option>
                      ))}
                    </select>
                    <ChevronDown
                      className="pointer-events-none absolute top-1/2 right-3 h-4 w-4 -translate-y-1/2 text-muted-foreground"
                      strokeWidth={1.6}
                    />
                  </div>
                </Field>
                <Field label="Ort" hint="genaue Adresse erst im Chat" error={err(0, "city")}>
                  <input
                    value={draft.city}
                    onChange={(e) => set({ city: e.target.value })}
                    placeholder="Zürich"
                    className={inputClass}
                  />
                </Field>
              </div>

              <Field label="Sprachen" group error={err(0, "languages")}>
                <div className="flex flex-wrap gap-2">
                  {LANGUAGES.map((l) => (
                    <Chip
                      key={l}
                      active={draft.languages.includes(l)}
                      onClick={() => toggle("languages", l)}>
                      {l}
                    </Chip>
                  ))}
                </div>
              </Field>
            </div>
          )}

          {/* ---------- Schritt 2 ---------- */}
          {step === 1 && (
            <div className="space-y-5">
              <Field
                label="Einzeiler"
                hint={`${draft.tagline.length}/${TAGLINE_MAX}`}
                error={err(1, "tagline")}>
                <input
                  value={draft.tagline}
                  maxLength={TAGLINE_MAX}
                  onChange={(e) => set({ tagline: e.target.value })}
                  placeholder="Der eine Satz, der in der Trefferliste steht."
                  className={inputClass}
                />
              </Field>

              <Field
                label="Über mich"
                hint={`${draft.about.length}/${ABOUT_MAX}`}
                error={err(1, "about")}>
                <textarea
                  value={draft.about}
                  maxLength={ABOUT_MAX}
                  rows={7}
                  onChange={(e) => set({ about: e.target.value })}
                  placeholder="Wer Sie sind, wie ein Treffen abläuft, was Ihnen wichtig ist. Ehrliche Texte bekommen messbar mehr Kontakte als Aufzählungen."
                  className={cn(inputClass, "resize-none leading-relaxed")}
                />
              </Field>

              <Field label="Angebot" group error={err(1, "services")}>
                <div className="flex flex-wrap gap-2">
                  {SERVICES.map((s) => (
                    <Chip
                      key={s}
                      active={draft.services.includes(s)}
                      onClick={() => toggle("services", s)}>
                      {s}
                    </Chip>
                  ))}
                </div>
              </Field>

              <Field label="Treffpunkt" group error={err(1, "place")}>
                <div className="flex flex-wrap gap-2">
                  <Chip active={draft.incall} onClick={() => set({ incall: !draft.incall })}>
                    Empfang in eigenen Räumen
                  </Chip>
                  <Chip active={draft.outcall} onClick={() => set({ outcall: !draft.outcall })}>
                    Ich besuche
                  </Chip>
                </div>
              </Field>
            </div>
          )}

          {/* ---------- Schritt 3 ---------- */}
          {step === 2 && (
            <div className="space-y-5">
              <div className="grid gap-4 sm:grid-cols-2">
                <Field label="30 Minuten" hint="optional">
                  <input
                    inputMode="numeric"
                    value={draft.rates.m30}
                    onChange={(e) =>
                      set({ rates: { ...draft.rates, m30: e.target.value.replace(/\D/g, "") } })
                    }
                    placeholder="CHF"
                    className={inputClass}
                  />
                </Field>
                <Field label="1 Stunde" hint="Pflicht" error={err(2, "h1")}>
                  <input
                    inputMode="numeric"
                    value={draft.rates.h1}
                    onChange={(e) =>
                      set({ rates: { ...draft.rates, h1: e.target.value.replace(/\D/g, "") } })
                    }
                    placeholder="CHF"
                    className={inputClass}
                  />
                </Field>
                <Field label="2 Stunden" hint="optional">
                  <input
                    inputMode="numeric"
                    value={draft.rates.h2}
                    onChange={(e) =>
                      set({ rates: { ...draft.rates, h2: e.target.value.replace(/\D/g, "") } })
                    }
                    placeholder="CHF"
                    className={inputClass}
                  />
                </Field>
                <Field label="Übernachtung" hint="optional">
                  <input
                    inputMode="numeric"
                    value={draft.rates.night}
                    onChange={(e) =>
                      set({ rates: { ...draft.rates, night: e.target.value.replace(/\D/g, "") } })
                    }
                    placeholder="CHF"
                    className={inputClass}
                  />
                </Field>
              </div>

              <p className="flex items-start gap-2 rounded-lg border border-line bg-surface-2/40 p-3.5 text-xs leading-relaxed text-muted-foreground">
                <Info className="mt-px h-3.5 w-3.5 shrink-0 text-gold" strokeWidth={1.6} />
                Ihre Preise gelten für Zeit und Begleitung. NOIRA erhält davon keinen Anteil und
                mischt sich in die Höhe nicht ein.
              </p>

              <Field
                label="Erreichbarkeit"
                hint="frei formulierbar"
                error={err(2, "availability")}>
                <input
                  value={draft.availability}
                  onChange={(e) => set({ availability: e.target.value })}
                  placeholder="Di–Sa, 16–02 Uhr"
                  className={inputClass}
                />
              </Field>

              <Field label="Telefonnummer" error={err(2, "phone")}>
                <input
                  inputMode="tel"
                  value={draft.phone}
                  onChange={(e) => set({ phone: e.target.value })}
                  placeholder="079 123 45 67"
                  className={cn(inputClass, "font-mono")}
                />
              </Field>

              <label className="flex cursor-pointer items-start gap-2.5 text-sm text-muted-foreground">
                <input
                  type="checkbox"
                  checked={draft.hidePhone}
                  onChange={(e) => set({ hidePhone: e.target.checked })}
                  className="mt-0.5 h-4 w-4 shrink-0 accent-[color:var(--noira-gold)]"
                />
                <span>
                  Nummer verbergen und Anrufe über eine NOIRA-Rufnummer weiterleiten
                  <span className="mt-0.5 block text-xs text-text-3">
                    Ihre echte Nummer sieht dann niemand — auch nicht nach dem Anruf.
                  </span>
                </span>
              </label>
            </div>
          )}

          {/* ---------- Schritt 4 ---------- */}
          {step === 3 && (
            <div className="space-y-6">
              <div>
                <div className="mb-3 flex items-baseline justify-between">
                  <span className="text-sm text-foreground">Fotos</span>
                  <span className="text-xs text-muted-foreground">
                    {photos.length} / {MAX_PHOTOS}
                  </span>
                </div>

                <div className="grid grid-cols-3 gap-2 sm:grid-cols-5">
                  {photos.map((p, i) => (
                    <div
                      key={p.url}
                      className="group relative aspect-[3/4] overflow-hidden rounded-lg border border-line">
                      <img src={p.url} alt="" className="h-full w-full object-cover" />
                      {i === 0 && (
                        <span className="absolute inset-x-0 bottom-0 bg-black/70 py-1 text-center text-[0.625rem] text-gold">
                          Titelbild
                        </span>
                      )}
                      <button
                        type="button"
                        onClick={() => {
                          URL.revokeObjectURL(p.url);
                          setPhotos((ps) => ps.filter((x) => x.url !== p.url));
                        }}
                        className="absolute top-1.5 right-1.5 rounded-full bg-black/70 p-1 opacity-0 transition group-hover:opacity-100 focus-visible:opacity-100"
                        aria-label="Foto entfernen">
                        <X className="h-3 w-3" strokeWidth={2.5} />
                      </button>
                    </div>
                  ))}

                  {photos.length < MAX_PHOTOS && (
                    <button
                      type="button"
                      onClick={() => photoInput.current?.click()}
                      className="flex aspect-[3/4] flex-col items-center justify-center gap-2 rounded-lg border border-dashed border-line text-xs text-muted-foreground transition hover:border-gold/50 hover:text-foreground">
                      <ImagePlus className="h-5 w-5" strokeWidth={1.5} />
                      Hinzufügen
                    </button>
                  )}
                </div>

                <input
                  ref={photoInput}
                  type="file"
                  accept="image/*"
                  multiple
                  className="sr-only"
                  onChange={(e) => {
                    if (e.target.files) addPhotos(e.target.files);
                    e.target.value = "";
                  }}
                />

                {err(3, "photos") && (
                  <p className="mt-2 text-xs text-destructive">{errorsByStep[3].photos}</p>
                )}
                <p className="mt-3 text-xs leading-relaxed text-text-3">
                  Das erste Foto ist das Titelbild. Bilder müssen Sie selbst zeigen und dürfen nicht
                  älter als zwölf Monate sein. Gesichter dürfen Sie unkenntlich machen — das kostet
                  erfahrungsgemäss Kontakte, ist aber Ihre Entscheidung.
                </p>
              </div>

              <div className="rule" />

              <div>
                <p className="eyebrow mb-4">Verifizierung</p>
                <div className="mb-4 flex gap-3 rounded-xl border border-gold/30 bg-gold/5 p-4">
                  <ShieldCheck className="h-5 w-5 shrink-0 text-gold" strokeWidth={1.5} />
                  <p className="text-xs leading-relaxed text-muted-foreground">
                    Ihr Codewort für heute lautet{" "}
                    <span className="font-mono text-sm text-gold">{codeword}</span>. Schreiben Sie
                    es auf einen Zettel und halten Sie ihn auf dem Selfie sichtbar. So wissen wir,
                    dass die Aufnahme heute entstanden ist und Ihnen gehört.
                  </p>
                </div>

                <div className="grid gap-3 sm:grid-cols-2">
                  <DropZone
                    label="Ausweisdokument"
                    note="Pass, ID oder Ausländerausweis. Verschlüsselt gespeichert, getrennt vom Inserat, 90 Tage nach Ablauf gelöscht."
                    file={idDoc}
                    onPick={(f) => setIdDoc({ url: URL.createObjectURL(f), name: f.name })}
                    onClear={() => {
                      if (idDoc) URL.revokeObjectURL(idDoc.url);
                      setIdDoc(null);
                    }}
                  />
                  <DropZone
                    label={`Selfie mit «${codeword}»`}
                    note="Ein Bild von Ihnen mit dem handgeschriebenen Codewort. Wird nur zum Abgleich verwendet und erscheint nie im Inserat."
                    file={selfie}
                    onPick={(f) => setSelfie({ url: URL.createObjectURL(f), name: f.name })}
                    onClear={() => {
                      if (selfie) URL.revokeObjectURL(selfie.url);
                      setSelfie(null);
                    }}
                  />
                </div>

                {(err(3, "idDoc") || err(3, "selfie")) && (
                  <p className="mt-2 text-xs text-destructive">
                    {errorsByStep[3].idDoc ?? errorsByStep[3].selfie}
                  </p>
                )}

                <p className="mt-4 text-xs leading-relaxed text-text-3">
                  In dieser Demo verlassen die Dateien Ihren Browser nicht — es wird nichts
                  hochgeladen und nichts gespeichert.
                </p>
              </div>
            </div>
          )}

          {/* --- Navigation --- */}
          <div className="mt-8 flex flex-col gap-3 border-t border-line pt-6 sm:flex-row sm:items-center sm:justify-between">
            <button
              onClick={() => (step === 0 ? navigate("/werben") : go(step - 1))}
              className="flex items-center justify-center gap-2 rounded-full border border-line px-5 py-3 text-sm transition hover:border-foreground/40">
              <ArrowLeft className="h-4 w-4" strokeWidth={1.6} />
              {step === 0 ? "Abbrechen" : "Zurück"}
            </button>

            <div className="flex items-center gap-3">
              <button
                onClick={() => setMobilePreview(true)}
                className="rounded-full border border-line px-5 py-3 text-sm transition hover:border-gold/50 lg:hidden">
                Vorschau
              </button>
              {step < STEPS.length - 1 ? (
                <button
                  onClick={() => go(step + 1)}
                  className="flex flex-1 items-center justify-center gap-2 rounded-full bg-gold px-6 py-3 text-sm font-semibold text-ink transition hover:brightness-110">
                  Weiter <ArrowRight className="h-4 w-4" strokeWidth={2} />
                </button>
              ) : (
                <button
                  onClick={finish}
                  className="flex flex-1 items-center justify-center gap-2 rounded-full bg-gold px-6 py-3 text-sm font-semibold text-ink transition hover:brightness-110">
                  Weiter zur Bezahlung <ArrowRight className="h-4 w-4" strokeWidth={2} />
                </button>
              )}
            </div>
          </div>
        </div>

        {/* --- Vorschau, Desktop --- */}
        <aside className="hidden lg:sticky lg:top-24 lg:block">{previewPanel}</aside>
      </div>

      {/* --- Vorschau, mobil --- */}
      {mobilePreview && (
        <div className="fixed inset-0 z-60 flex flex-col bg-ink px-5 py-6 lg:hidden">
          <button
            onClick={() => setMobilePreview(false)}
            className="mb-6 self-end rounded-md p-2"
            aria-label="Vorschau schliessen">
            <X className="h-5 w-5" strokeWidth={1.6} />
          </button>
          <div className="overflow-y-auto">{previewPanel}</div>
        </div>
      )}
    </div>
  );
}
