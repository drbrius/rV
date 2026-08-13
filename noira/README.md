# NOIRA — noira.ch

Schweizer Inserateplattform für erotische Dienstleistungen. Vollständiges Frontend
(React 19 · TypeScript · Tailwind 4 · Vite), inklusive Suche, Filter, Profilseiten,
Inseratepakete und Kasse mit Kreditkarte, TWINT und Krypto.

```bash
pnpm install
pnpm dev        # http://localhost:3000
pnpm build      # dist/
pnpm check      # tsc --noEmit
pnpm bundle     # dist/noira-einzeldatei.html — alles in einer Datei
```

`pnpm bundle` faltet JS, CSS, Schriften und Favicon in eine einzige HTML-Datei
und schaltet die Routen auf Hash-Navigation um. Damit läuft die ganze Seite ohne
Server — per Doppelklick, als Anhang oder als geteilte Vorschau. Für die
reguläre Auslieferung bleibt `pnpm build` mit sauberen Pfaden.

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

## 3. Marke: die Eklipse

Der Name enthält das Zeichen bereits — **NOIR**, die verdeckte Scheibe, und
**AURA**, die Korona, die darum leuchtet. Genau das ist das Versprechen der
Plattform: nichts wird ausgestellt, alles leuchtet am Rand.

**Das Zeichen** (`components/Wordmark.tsx`) ist eine Eklipse: Lichtring, dunkle
Scheibe, goldene Sichel und der helle Punkt des Diamantring-Effekts. Es **ersetzt
das O im Wort** — die Stelle, an der eine Marke unverwechselbar wird. Weil es ein
Kreis bleibt, liest es sich auch als Buchstabe, wenn man das Konzept nicht kennt;
das ist die Bedingung dafür, dass ein Logo ungewöhnlich sein darf. `EclipseMark`
steht zusätzlich allein (Favicon, App-Icon, Altersschranke).

**Die Kategorie-Zeichen** (`components/Phase.tsx`) sind neun Phasen derselben
Eklipse: gleiche Scheibe, gleicher Saum, nur der Winkel der Verdeckung ändert
sich. Eine erkennbare Familie statt neun zusammengesuchter Symbole — und immer
neben der Beschriftung, nie an ihrer Stelle. Ein Zeichen, das seine Bedeutung
erst erklären muss, darf nicht allein navigieren.

**Dieselbe Figur im ganzen Layout:** der Lichtsaum, der beim Hover über die obere
Kante jeder Karte fährt; der Lesefortschritt als Korona-Linie unter der
Navigation; die Trennlinien, die zur Mitte hin aufleuchten; der glühende Punkt vor
jedem Majuskel-Label; der Lichtring um jedes Monogramm.

### Farbe

| Rolle | Wert | Einsatz |
| --- | --- | --- |
| Grund | `oklch(0.115 0.009 295)` — kühles Nachtschwarz | Seitenhintergrund |
| Fläche | `oklch(0.163 0.011 295)` | Karten, Panels |
| Gold | `oklch(0.828 0.108 82)` | Primäraktion, Preise, Premium |
| Korona | `oklch(0.955 0.048 92)` | Lichtkanten, Verlaufsspitzen |
| Orchidee | `oklch(0.64 0.184 349)` | „Neu", Merkliste |
| Verifiziert | `oklch(0.76 0.128 165)` | Prüfzeichen, Online-Status |

Der Grund ist dunkler als bei vergleichbaren Seiten — die Korona wirkt nur, wenn
die Scheibe wirklich schwarz ist.

### Typografie

**Bodoni Moda** als Display. Ihr extremer Kontrast zwischen Haar- und Grundstrich
ist dieselbe Figur wie die Eklipse: Licht neben Dunkel, ohne Zwischenton; ihre
kreisrunden Punzen nehmen die Form des Zeichens auf. **Inter** trägt alles, was
gelesen statt bewundert wird, **JetBrains Mono** die gesperrten Majuskel-Labels.

Drei Stufen, damit die Eleganz nicht auf Kosten der Lesbarkeit geht:

| Klasse | Einsatz |
| --- | --- |
| `.display` | ab 24px — Bodoni 400, die eigentliche Stimme der Marke |
| `.display-sm` | 18–24px — Bodoni 500, sonst brechen die Haarstriche weg |
| `.numeral` | Preise und Kennzahlen — Bodoni 600, Tabellenziffern |

Alles unter 18px ist Inter. Eine Schrift, die man bewundert, aber nicht lesen
kann, ist auf einer Plattform mit Preisen und Telefonnummern ein Fehler.

**Schriften werden selbst ausgeliefert** (`client/public/fonts`, `@font-face` in
`index.css`, nur die Subsets `latin` und `latin-ext`). Kein Aufruf zu
fonts.googleapis.com: Wer Diskretion verspricht, darf die IP-Adresse seiner
Besuchenden nicht für Schriften an Dritte weiterreichen.

**Bildsprache:** Der Demo-Datensatz enthält bewusst **keine Personenfotos**.
`Portrait.tsx` erzeugt aus der Inserat-ID ein stabiles, abstraktes Farbmotiv mit
Monogramm im Lichtring. In Produktion tritt an dieselbe Stelle das erste
freigegebene Foto.

## 4. Mehrsprachigkeit

Die Schweiz hat vier Sprachregionen — eine Plattform, die nur Deutsch kann, ist
im Tessin und in der Romandie kein Angebot. Der Umschalter im Kopf schaltet
jetzt tatsächlich um: **DE · FR · IT · EN**.

Umgesetzt ohne Bibliothek (`lib/i18n.ts`): ein flaches Wörterbuch, ein Store
über `useSyncExternalStore`, ein `t()` mit `{platzhalter}`. i18next käme mit
40 kB und Funktionen, die dieser Umfang nicht braucht. Die Wahl liegt in
`localStorage`, `<html lang>` wird mitgeführt, und fehlt eine Übersetzung,
greift Deutsch — nie ein roher Schlüssel.

**Vollständig übersetzt** ist die Oberfläche, die auf jeder Seite mitläuft:
Navigation, Fusszeile, Altersschranke, Inseratekarten, Suche und Filter,
Merkliste, Fehlerseite. Dazu die Kategorien und die Kantonsnamen in ihrer
jeweiligen Form (Genf / Genève / Ginevra / Geneva). Zeitangaben laufen über
`Intl.RelativeTimeFormat` mit — „vor 2 Wochen" auf einer französischen Seite
wäre schlicht falsch. Beträge bleiben im Schweizer Format mit Apostroph, das
in allen vier Sprachregionen die gewohnte Schreibweise ist.

**Noch nicht übersetzt** sind die langen redaktionellen Texte: Startseite,
Inserieren, Kasse, Sicherheit, Recht. Diese Seiten tragen in den anderen
Sprachen einen sichtbaren Hinweis statt einer maschinellen Ersetzung. Bei AGB
und Sicherheitshinweisen einer Erotikplattform ist eine schiefe Formulierung
ein Haftungsrisiko — das gehört zu einer Fachübersetzerin.

Aus demselben Grund ist die Vorgabe **Deutsch statt Browsersprache**: Solange
die Fliesstexte deutsch sind, bekäme ein englischer Browser sonst eine
englische Hülle um deutschen Inhalt. Sobald die Texte übersetzt sind, gehört
an die eine markierte Stelle in `i18n.ts` die Browsersprache.

## 5. Seiten und Informationsarchitektur

| Route | Inhalt |
| --- | --- |
| `/` | Suche zuerst, Kennzahlen, Kategorien, Premium, Vertrauen, Neuzugänge, Regionen, Anbietenden-CTA, FAQ |
| `/inserate` | Trefferliste; **der gesamte Filterzustand liegt in der URL** (teilbar, zurück-navigierbar, indexierbar) |
| `/inserat/:slug` | Galerie, Beschrieb, Services, Tarife, Sicherheitshinweis, mitlaufende Kontaktkarte (Nummer erst auf Klick), ähnliche Inserate |
| `/clubs` | Häuser und Studios im Breitformat — Öffnungszeiten und Eintritt statt Portrait |
| `/merkliste` | Gemerkte Inserate — im Browser gespeichert, ohne Konto und ohne Server |
| `/werben` | Ablauf in drei Schritten, Preistabelle mit Laufzeit-Umschalter, Zahlungsarten |
| `/inserat-erfassen` | Vierstufiger Editor mit **Live-Vorschau der Trefferkarte**, Autosave im Browser, Foto-Upload und Verifizierung mit Tages-Codewort |
| `/kasse` | Einspaltige Kasse mit mitlaufender Übersicht; Karte / TWINT / Krypto |
| `/sicherheit` | Hausordnung, echte Anlaufstellen (117, ACT212, FIZ, ProCoRe), Meldeformular, Tipps für beide Seiten |
| `/login`, `/registrieren` | Konto nur für Inserierende — Suchen funktioniert ohne Anmeldung |
| `/agb`, `/datenschutz`, `/impressum` | Entwurfstexte (DSG/DSGVO, UWG) |

**Der Weg für Anbietende ist geschlossen:** `/werben` → Paket wählen →
`/inserat-erfassen` → `/kasse`. Paket und Laufzeit werden dabei als
Query-Parameter durchgereicht, der Entwurf liegt in `localStorage` — wer
unterbrochen wird, verliert nichts. Vorwärts kommt nur, wer den aktuellen
Schritt vollständig ausgefüllt hat; zurück geht immer.

**Alterskontrolle:** `AgeGate.tsx` blockiert die Seite vor allem anderen; die
Bestätigung gilt 90 Tage (localStorage). Meta-Tag `rating=adult` für Jugendschutzfilter.

## 6. Zahlung

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

## 7. Was noch fehlt

Reines Frontend; alle Daten liegen als Demo-Datensatz in `client/src/data/`.
Für den Betrieb fehlen:

- API und Datenbank (`GET /api/listings`, `/api/stats`), Volltextsuche, Paginierung
- Konten, Sitzungen und die Moderationsschlange hinter dem Editor
- Verifizierung serverseitig: Codewort pro Konto, verschlüsselte Ablage,
  90-Tage-Löschfrist (die Oberfläche dafür steht, die Dateien verlassen den
  Browser noch nicht)
- Anbindung der Zahlungsanbieter samt Webhooks und Belegversand
- Fachübersetzung der langen Texte in FR / IT / EN (Oberfläche ist übersetzt)
- Rechtstexte anwaltlich prüfen; kantonale Melde- und Bewilligungspflichten abbilden
