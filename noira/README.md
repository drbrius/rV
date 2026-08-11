# NOIRA — noira.ch

Schweizer Inserateplattform für erotische Dienstleistungen. Vollständiges Frontend
(React 19 · TypeScript · Tailwind 4 · Vite), inklusive Suche, Filter, Profilseiten,
Inseratepakete und Kasse mit Kreditkarte, TWINT und Krypto.

```bash
pnpm install
pnpm dev        # http://localhost:3000
pnpm build      # dist/
pnpm check      # tsc --noEmit
```

---

## 1. Analyse der Referenzen

**xdate.ch** (seit 2001) und **and6.com** sind die beiden etablierten Schweizer
Erotikportale. Beide funktionieren nach demselben Muster:

| Ebene | Was beide gut machen | Wo sie verlieren |
| --- | --- | --- |
| Geschäftsmodell | Reines Inserategeschäft, keine Vermittlung, keine Provision auf die Dienstleistung | — |
| Reichweite | Zwanzig Jahre Bestandsdaten, tausende Inserate, alle Kantone | Masse ohne Kuratierung |
| Filter | Sehr granular (Region, Kategorie, 27+ Services, Ethnie, Video) | Filterwüste ohne Hierarchie; alles gleich wichtig |
| Design | Funktional, vertraut | Verzeichnis-Ästhetik der 2000er: dichte Tabellen, grelle Banner, Thumbnail-Raster, kein Weissraum |
| Mobil | Vorhanden | Nachträglich aufgesetzt statt zuerst gedacht |
| Vertrauen | Profilprüfung wird behauptet | Nicht sichtbar gemacht — Verifizierung ist kein Gestaltungselement |
| Zahlung | Kredit-/Guthabensystem, Karte | Krypto und TWINT fehlen oder sind versteckt; Diskretion der Abrechnung wird nicht thematisiert |

**Die Lücke:** Beide verkaufen Menge. Niemand verkauft *Haltung*. Wer heute in diesem
Markt neu antritt, gewinnt nicht über mehr Inserate, sondern über Vertrauen,
Diskretion und ein Erscheinungsbild, das die Kundschaft nicht verstecken muss.

## 2. Positionierung von NOIRA

Drei Entscheidungen, aus denen alles Weitere folgt:

1. **Kuratiert statt überladen.** Weniger Filter im Blickfeld, dafür die richtigen.
   Sortierung „Empfohlen" heisst: bezahlte Platzierung, dann Verifizierung, dann
   Aktualität — offen dokumentiert statt als Blackbox.
2. **Vertrauen ist Gestaltung.** Das Verifiziert-Zeichen, die Meldestelle im Footer
   und die Sicherheitsseite sind keine Fussnoten, sondern feste Bestandteile jeder
   Ansicht. Die Plattform grenzt selbstbestimmte Sexarbeit sichtbar von Ausbeutung ab.
3. **Diskretion bis zur Abrechnung.** Drei Zahlungswege mit unterschiedlichem
   Anonymitätsgrad — Karte, TWINT, Krypto — und ein neutraler Buchungstext, der
   auf keinem Kontoauszug erklärt werden muss.

## 3. Design-System

„Noir Luxe": Editorial-Ästhetik in Nachtschwarz, Gold als einziger Leuchtakzent.
Tokens liegen zentral in `client/src/index.css`.

| Rolle | Wert | Einsatz |
| --- | --- | --- |
| Grund | `oklch(0.128 0.008 300)` — warmes Nachtschwarz | Seitenhintergrund |
| Fläche | `oklch(0.176 0.011 300)` | Karten, Panels |
| Gold | `oklch(0.815 0.101 84)` | Primäraktion, Preise, Premium |
| Orchidee | `oklch(0.64 0.184 349)` | „Neu", Merkliste |
| Verifiziert | `oklch(0.76 0.128 165)` | Prüfzeichen, Online-Status |

**Typografie:** Cormorant Garamond (Display, 300er Schnitt, kursiv für den Akzent),
Inter (Fliesstext, UI), JetBrains Mono (Labels in Majuskeln mit `0.22em` Sperrung —
die Signatur des Layouts).

**Bildsprache:** Der Demo-Datensatz enthält bewusst **keine Personenfotos**.
`Portrait.tsx` erzeugt aus der Inserat-ID ein stabiles, abstraktes Farbmotiv mit
Monogramm. In Produktion tritt an dieselbe Stelle das erste freigegebene Foto.

## 4. Seiten und Informationsarchitektur

| Route | Inhalt |
| --- | --- |
| `/` | Suche zuerst, Kennzahlen, Kategorien, Premium, Vertrauen, Neuzugänge, Regionen, Anbietenden-CTA, FAQ |
| `/inserate` | Trefferliste; **der gesamte Filterzustand liegt in der URL** (teilbar, zurück-navigierbar, indexierbar) |
| `/inserat/:slug` | Galerie, Beschrieb, Services, Tarife, Sicherheitshinweis, mitlaufende Kontaktkarte (Nummer erst auf Klick), ähnliche Inserate |
| `/clubs` | Häuser und Studios im Breitformat — Öffnungszeiten und Eintritt statt Portrait |
| `/werben` | Ablauf in drei Schritten, Preistabelle mit Laufzeit-Umschalter, Zahlungsarten |
| `/kasse` | Einspaltige Kasse mit mitlaufender Übersicht; Karte / TWINT / Krypto |
| `/sicherheit` | Hausordnung, echte Anlaufstellen (117, ACT212, FIZ, ProCoRe), Meldeformular, Tipps für beide Seiten |
| `/login`, `/registrieren` | Konto nur für Inserierende — Suchen funktioniert ohne Anmeldung |
| `/agb`, `/datenschutz`, `/impressum` | Entwurfstexte (DSG/DSGVO, UWG) |

**Alterskontrolle:** `AgeGate.tsx` blockiert die Seite vor allem anderen; die
Bestätigung gilt 90 Tage (localStorage). Meta-Tag `rating=adult` für Jugendschutzfilter.

## 5. Zahlung

Preise: Basis CHF 29/79/189 · Plus 59/149/379 · Premium 119/299/749 (7/30/90 Tage),
zzgl. 8,1 % MWST. Kein Abo — die Laufzeit endet automatisch.

Die Kasse ist als **vollständige Oberfläche ohne Anbindung** gebaut:
Kartennummer wird formatiert und gegen Luhn geprüft, Ablaufdatum und Prüfziffer
(3 bzw. 4 Stellen bei Amex) validiert, TWINT gegen das Schweizer Mobilnummernformat,
Krypto mit Kurs­fixierung über 15 Minuten und Netzwerk-Angabe. Das sind
Eingabehilfen, keine Freigabe.

**Für die Produktion vorgesehen:**

| Weg | Anbieter | Hinweis |
| --- | --- | --- |
| Karte | Datatrans oder Stripe Elements | Kartendaten laufen über gehostete Felder — der Betrieb bleibt ausserhalb des PCI-DSS-Geltungsbereichs. 3-D Secure obligatorisch. |
| TWINT | Datatrans | QR am Desktop, App-to-App auf dem Mobilgerät |
| Krypto | BTCPay Server (selbst gehostet) oder Coinbase Commerce | Freischaltung nach der ersten Netzwerkbestätigung |

Buchungstext auf allen Abrechnungen: `NM DIGITAL GMBH, ZUERICH`.

> Wichtig: Erotik gilt bei den meisten Acquirern als Hochrisiko-Branche. Vor dem
> Livegang braucht es einen Acquirer mit ausdrücklicher Freigabe für MCC 7273 —
> das ist der kritische Pfad des Projekts, nicht die Technik.

## 6. Was noch fehlt

Reines Frontend; alle Daten liegen als Demo-Datensatz in `client/src/data/`.
Für den Betrieb fehlen:

- API und Datenbank (`GET /api/listings`, `/api/stats`), Volltextsuche, Paginierung
- Konten, Sitzungen, Inserats-Editor mit Bild-Upload und Moderationsschlange
- Verifizierungs-Workflow inkl. verschlüsselter Ablage und 90-Tage-Löschfrist
- Anbindung der Zahlungsanbieter samt Webhooks und Belegversand
- Übersetzungen FR / IT / EN (Umschalter ist angelegt, Inhalte sind Deutsch)
- Rechtstexte anwaltlich prüfen; kantonale Melde- und Bewilligungspflichten abbilden
