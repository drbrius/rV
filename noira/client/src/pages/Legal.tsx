/* ============================================================
   Rechtliches — AGB, Datenschutz, Impressum
   Eine Seite, drei Inhalte, gesteuert über die Route.

   ACHTUNG: Entwurfstexte für die Gestaltung. Vor dem Livegang
   müssen sie anwaltlich geprüft und an die tatsächliche
   Gesellschaft, die eingesetzten Dienstleister und die
   kantonalen Bewilligungen angepasst werden.
   ============================================================ */

import { Link, useLocation } from "wouter";

type Section = { title: string; body: string[] };
type Doc = { title: string; intro: string; updated: string; sections: Section[] };

const AGB: Doc = {
  title: "Allgemeine Geschäftsbedingungen",
  intro:
    "Diese Bedingungen regeln die Nutzung der Plattform noira.ch durch Inserierende und Besuchende.",
  updated: "1. August 2026",
  sections: [
    {
      title: "1. Gegenstand",
      body: [
        "NOIRA betreibt eine Online-Plattform, auf der volljährige Personen und bewilligte Betriebe eigenständig Inserate über erotische Dienstleistungen veröffentlichen können.",
        "NOIRA ist ausschliesslich Betreiberin der technischen Plattform. Wir vermitteln keine Dienstleistungen, treten keinem Vertrag zwischen Inserierenden und Besuchenden bei und erhalten keinen Anteil an deren Entgelt.",
      ],
    },
    {
      title: "2. Zugang und Mindestalter",
      body: [
        "Der Zugang zur Plattform ist Personen ab 18 Jahren vorbehalten. Mit dem Bestätigen der Alterserklärung versichern Sie, volljährig zu sein.",
        "Inserierende weisen ihr Alter zusätzlich mit einem amtlichen Ausweisdokument nach. Ohne diesen Nachweis erfolgt keine Freischaltung.",
      ],
    },
    {
      title: "3. Pflichten der Inserierenden",
      body: [
        "Inserate dürfen nur von der anbietenden Person selbst oder mit deren nachweisbarer, schriftlicher Zustimmung erstellt werden.",
        "Fotos müssen die inserierende Person zeigen, nicht älter als zwölf Monate sein und dürfen keine Rechte Dritter verletzen.",
        "Angaben zu Leistungen, Preisen und Erreichbarkeit müssen zutreffen. Unzulässig sind insbesondere Inserate, die auf Zwang, Menschenhandel, Minderjährige oder nicht bewilligte Erwerbstätigkeit hinweisen.",
        "Inserierende sind für die Einhaltung der für sie geltenden Vorschriften selbst verantwortlich — insbesondere Melde- und Bewilligungspflichten des Kantons, Sozialversicherungen und Steuern.",
      ],
    },
    {
      title: "4. Preise, Zahlung und Laufzeit",
      body: [
        "Die Preise der Inseratepakete richten sich nach der zum Zeitpunkt der Bestellung gültigen Preisliste, zuzüglich der gesetzlichen Mehrwertsteuer.",
        "Zahlbar per Kreditkarte, TWINT oder Kryptowährung. Bei Kryptozahlungen gilt der bei Bestellung angezeigte Kurs für 15 Minuten; danach wird neu berechnet.",
        "Pakete laufen nach Ablauf der gebuchten Dauer automatisch aus. Es entsteht kein Abonnement und keine Kündigungsfrist.",
        "Bereits freigeschaltete Inserate werden nicht zurückerstattet. Wird ein Inserat vor der Freischaltung abgelehnt, erstatten wir den vollen Betrag über denselben Zahlungsweg.",
      ],
    },
    {
      title: "5. Prüfung, Sperrung und Löschung",
      body: [
        "Wir prüfen Inserate vor der Freischaltung und stichprobenweise danach. Bei begründetem Verdacht auf Verstösse sperren wir das Inserat ohne Vorankündigung und ohne Rückerstattung.",
        "Hinweise auf Zwang, Menschenhandel oder Minderjährige melden wir unverzüglich den zuständigen Behörden.",
      ],
    },
    {
      title: "6. Haftung",
      body: [
        "NOIRA haftet nicht für Inhalte der Inserate, für das Zustandekommen oder den Verlauf von Treffen und für Handlungen der Nutzenden.",
        "Für Schäden aus leichter Fahrlässigkeit ist die Haftung im gesetzlich zulässigen Rahmen ausgeschlossen.",
      ],
    },
    {
      title: "7. Anwendbares Recht und Gerichtsstand",
      body: [
        "Es gilt Schweizer Recht unter Ausschluss der Kollisionsnormen. Gerichtsstand ist Zürich, soweit nicht zwingend ein anderer Gerichtsstand vorgeschrieben ist.",
      ],
    },
  ],
};

const DATENSCHUTZ: Doc = {
  title: "Datenschutzerklärung",
  intro:
    "Wir bearbeiten Personendaten nach dem revidierten Schweizer Datenschutzgesetz (DSG) und, soweit anwendbar, nach der DSGVO.",
  updated: "1. August 2026",
  sections: [
    {
      title: "1. Verantwortliche Stelle",
      body: [
        "Noira Media GmbH, Zürich. Anfragen zum Datenschutz richten Sie an datenschutz@noira.ch.",
      ],
    },
    {
      title: "2. Welche Daten wir bearbeiten",
      body: [
        "Besuchende: gekürzte IP-Adresse, Zeitpunkt, aufgerufene Seite und Gerätetyp — ausschliesslich zur Sicherheit und zur aggregierten Reichweitenmessung.",
        "Inserierende: E-Mail-Adresse, Inseratsinhalte, Zahlungsstatus und Verifizierungsunterlagen.",
        "Wir führen keine Profile über Suchverhalten und verkaufen keine Daten. Es werden keine Werbe-Cookies Dritter gesetzt.",
      ],
    },
    {
      title: "3. Verifizierungsunterlagen",
      body: [
        "Ausweiskopien und Verifizierungs-Selfies werden verschlüsselt und getrennt von den Inseratsdaten gespeichert. Zugriff hat ausschliesslich das Prüfteam.",
        "Die Unterlagen werden 90 Tage nach Ablauf des letzten Inserats automatisch gelöscht, soweit keine gesetzliche Aufbewahrungspflicht entgegensteht.",
      ],
    },
    {
      title: "4. Zahlungen",
      body: [
        "Kartenzahlungen und TWINT wickelt unser Zahlungsdienstleister ab. Vollständige Kartendaten gelangen nie auf unsere Server; wir erhalten lediglich Status, Betrag und die letzten vier Ziffern.",
        "Bei Kryptozahlungen speichern wir Transaktions-ID und Betrag. Eine Wallet-Adresse ordnen wir keiner Identität zu.",
        "Auf Abrechnungen erscheint eine neutrale Bezeichnung ohne Hinweis auf die Branche.",
      ],
    },
    {
      title: "5. Ihre Rechte",
      body: [
        "Sie haben Anspruch auf Auskunft, Berichtigung, Löschung, Einschränkung und Datenherausgabe. Eine Löschung Ihres Kontos entfernt sämtliche Inhalte innert 30 Tagen.",
        "Beschwerden können Sie beim Eidgenössischen Datenschutz- und Öffentlichkeitsbeauftragten (EDÖB) einreichen.",
      ],
    },
    {
      title: "6. Aufbewahrung und Standort",
      body: [
        "Server und Backups befinden sich in der Schweiz. Protokolldaten werden nach 90 Tagen gelöscht, Buchhaltungsdaten nach zehn Jahren.",
      ],
    },
  ],
};

const IMPRESSUM: Doc = {
  title: "Impressum",
  intro: "Angaben gemäss Art. 3 UWG.",
  updated: "1. August 2026",
  sections: [
    {
      title: "Betreiberin",
      body: [
        "Noira Media GmbH",
        "Musterstrasse 00, 8001 Zürich, Schweiz",
        "Handelsregister des Kantons Zürich · CHE-000.000.000",
        "MWST-Nummer CHE-000.000.000 MWST",
      ],
    },
    {
      title: "Kontakt",
      body: [
        "Allgemein: support@noira.ch",
        "Inserate und Partner: partner@noira.ch",
        "Datenschutz: datenschutz@noira.ch",
        "Missbrauch und Meldungen: meldung@noira.ch (Bearbeitung innert einer Stunde)",
      ],
    },
    {
      title: "Verantwortlich für den Inhalt",
      body: [
        "Die Inhalte der Inserate stammen von den jeweiligen Inserierenden. Für redaktionelle Inhalte der Plattform ist die Geschäftsleitung der Noira Media GmbH verantwortlich.",
      ],
    },
    {
      title: "Jugendschutz",
      body: [
        "Diese Website ist mit dem RTA-Label («Restricted To Adults») gekennzeichnet und kann mit gängiger Jugendschutzsoftware gefiltert werden.",
      ],
    },
  ],
};

const DOCS: Record<string, Doc> = {
  "/agb": AGB,
  "/datenschutz": DATENSCHUTZ,
  "/impressum": IMPRESSUM,
};

const NAV = [
  { href: "/agb", label: "AGB" },
  { href: "/datenschutz", label: "Datenschutz" },
  { href: "/impressum", label: "Impressum" },
];

export default function Legal() {
  const [location] = useLocation();
  const doc = DOCS[location] ?? AGB;

  return (
    <div className="container-noira py-12">
      <div className="grid gap-12 lg:grid-cols-[14rem_1fr]">
        <aside>
          <div className="sticky top-24">
            <p className="eyebrow mb-4">Rechtliches</p>
            <nav className="flex flex-col gap-1">
              {NAV.map((n) => (
                <Link
                  key={n.href}
                  href={n.href}
                  className={
                    location === n.href
                      ? "rounded-lg bg-surface px-3 py-2 text-sm text-foreground"
                      : "rounded-lg px-3 py-2 text-sm text-muted-foreground transition hover:text-foreground"
                  }>
                  {n.label}
                </Link>
              ))}
            </nav>
          </div>
        </aside>

        <article className="max-w-2xl">
          <h1 className="display text-4xl sm:text-5xl">{doc.title}</h1>
          <p className="mt-4 leading-relaxed text-muted-foreground">{doc.intro}</p>
          <p className="mt-2 text-xs text-muted-foreground/60">
            Zuletzt aktualisiert: {doc.updated}
          </p>

          <div className="rule my-10" />

          <div className="space-y-10">
            {doc.sections.map((s) => (
              <section key={s.title}>
                <h2 className="display mb-4 text-2xl">{s.title}</h2>
                <div className="space-y-3">
                  {s.body.map((p) => (
                    <p key={p} className="text-sm leading-relaxed text-muted-foreground">
                      {p}
                    </p>
                  ))}
                </div>
              </section>
            ))}
          </div>

          <p className="mt-14 rounded-xl border border-line bg-surface/60 p-5 text-xs leading-relaxed text-muted-foreground/70">
            Entwurfsfassung für die Gestaltung. Vor der Aufschaltung sind diese Texte anwaltlich zu
            prüfen und an die tatsächliche Gesellschaft, die eingesetzten Dienstleister sowie die
            kantonalen Melde- und Bewilligungspflichten anzupassen.
          </p>
        </article>
      </div>
    </div>
  );
}
