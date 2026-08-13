# NOIRA — noira.ch

Schweizer Inserateplattform für erotische Dienstleistungen. Frontend
(React 19 · TypeScript · Tailwind 4 · Vite) und Backend (Fastify 5 · SQLite über
`node:sqlite`): Suche, Filter, Profilseiten, Inserate-Editor, Moderation,
Verifizierung mit Löschfrist, Inseratepakete und Kasse mit Kreditkarte, TWINT
und Krypto.

```bash
pnpm install

# Oberfläche
pnpm dev        # http://localhost:3000
pnpm build      # dist/
pnpm check      # tsc --noEmit
pnpm bundle     # dist/noira-einzeldatei.html — alles in einer Datei
pnpm check:contrast   # WCAG-Kontrastprüfung gegen die laufende Vorschau
pnpm check:embedded   # setzt die Seite ihren Grund auch in fremder Hülle durch?

# Server
pnpm seed          # Demo-Datenbestand: 28 Inserate, Bilder, 3 Konten
pnpm server        # http://localhost:4000
pnpm test          # 55 Tests
pnpm check:server  # Typprüfung des Servers
```

Einzelheiten zum Backend — Endpunkte, Regeln, Datenmodell, Weg nach
PostgreSQL — stehen in [`server/README.md`](server/README.md).

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
| Grund | `#201E29` — Anthrazit mit Violettstich | Seitenhintergrund |
| Fläche | `#2A2735` | Karten, Panels |
| Gold | `#E7C57E` | Primäraktion, Preise, Premium (9.9:1) |
| Korona | `#FBEFCF` | Lichtkanten, Verlaufsspitzen |
| Orchidee | `#E06BA8` | „Neu", Merkliste (5.4:1) |
| Verifiziert | `#63D3A8` | Prüfzeichen, Online-Status (8.9:1) |

Der Grund ist bewusst **kein Schwarz**. Reines Schwarz hinter heller Schrift
erzeugt Halation: Die Buchstaben glühen aus und wirken unscharf, egal wie gut
der gemessene Kontrast ist. Ein tiefes Anthrazit behält die Nacht und beendet
das Verlaufen.

> Fallstrick beim Umbau: `oklch()`-Helligkeit ist **nicht** CIE L*. Ein erster
> Versuch mit `oklch(0.178)` sah nach „deutlich angehoben" aus und ergab
> gemessen `rgb(17,16,21)` — praktisch weiterhin Schwarz, weil die Leuchtdichte
> kubisch folgt (0.178³ ≈ 0.006). Die Palette ist darum aus Ziel-Hexwerten
> zurückgerechnet und am gerenderten Pixel nachgemessen.

### Typografie

**Fraunces** als Display, **Inter** für alles, was gelesen statt bewundert wird,
**JetBrains Mono** für die gesperrten Majuskel-Labels.

Die erste Fassung setzte **Bodoni Moda** — konzeptionell schlüssig, weil ihr
Kontrast zwischen Haar- und Grundstrich dieselbe Figur ist wie die Eklipse.
In der Praxis war sie unlesbar: Didone-Haarstriche liegen bei diesen Graden
unter einem Pixel, und helle Feinlinien auf dunklem Grund verlaufen. Der
gemessene Kontrast sagte 11:1, das Auge sah Unschärfe — **Kontrastwerte
erfassen Strichstärke nicht.**

Die Nachfolge wurde nicht geraten, sondern im direkten Vergleich gewählt:
Fraunces, Newsreader, Spectral, Instrument Serif und Playfair Display, alle
mit demselben Text auf demselben Grund gesetzt und nebeneinander betrachtet.
Fraunces hat mit Abstand das meiste Fleisch in den dünnen Strichen und bringt
eine Achse für die optische Grösse mit — kleine Grade werden damit automatisch
kräftiger, nicht dünner.

Drei Stufen, damit die Eleganz nicht auf Kosten der Lesbarkeit geht:

| Klasse | Einsatz |
| --- | --- |
| `.display` | ab 24px — Fraunces 500 |
| `.display-sm` | 18–24px — Fraunces 600 |
| `.numeral` | Preise und Kennzahlen — Fraunces 650, Tabellenziffern |

Ausserdem sind die Schriftgrade eine Stufe grösser als die Vorgabe (13 / 15 /
17px statt 12 / 14 / 16): Auf dunklem Grund wirkt Schrift kleiner als auf
hellem.

### Textfarben: drei Stufen, gemessen

Anfangs war Text mit Deckkraft-Modifikatoren abgedunkelt — `/70`, `/60`, `/50`.
Das erzeugt beliebig viele Stufen, die niemand entworfen hat, und auf diesem
sehr dunklen Grund fielen 25 Stellen unter den Lesbarkeitsschwellwert. Jetzt
drei benannte Stufen, jede gegen den dunkelsten vorkommenden Grund gemessen:

| Token | Einsatz | Kontrast |
| --- | --- | --- |
| `--noira-text-1` | Überschriften, Werte, Eingaben | 15:1 |
| `--noira-text-2` | Fliesstext, Sekundäres | 11.3:1 |
| `--noira-text-3` | Bildlegenden, Rechtliches, Meta | 7.9:1 |

`pnpm check:contrast` prüft das nach: Es geht jede Seite durch, rechnet für
jeden Textknoten die tatsächliche Vorder- über die tatsächliche
Hintergrundfarbe — Ebene für Ebene, inklusive Alpha und geerbter `opacity` —
und bricht ab, sobald etwas unter WCAG AA liegt. Stand heute: **5322 Textknoten
auf 16 Seiten, null Verstösse**, nichts unter 5.3:1.

### Der Grund gehört der Seite, nicht dem Gastgeber

Der hartnäckigste Lesbarkeitsfehler war keiner der Seite selbst. Eingebettet in
eine fremde Hülle — Vorschau, Artifact, CMS — setzt der Gastgeber sein eigenes
`body { background: #fff }`. Und weil **ungelayertes CSS jede Regel in einem
`@layer` schlägt**, unabhängig von Spezifität und Reihenfolge, gewinnt diese
eine Zeile gegen alles, was Tailwind in `@layer base` legt. Ergebnis: die
Farben eines dunklen Themas auf weisser Fläche.

Für sich gemessen war die Seite dabei tadellos — der Fehler entsteht erst durch
die Umgebung. Darum stehen Grund und Textfarbe jetzt **ausserhalb** jedes
Layers, zusätzlich auf `#root`, und die App malt ihren Grund im eigenen
Wurzelknoten (`Layout`). `pnpm check:embedded` baut die feindliche Hülle nach
und schlägt Alarm, wenn der Gastgeber durchscheint.

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

## 7. Auslieferung

### Oberfläche auf Vercel

Das Frontend ist eine statische Einzelseiten-Anwendung und läuft auf
Vercel ohne Zutun. `vercel.json` liegt bereit: Build, SPA-Rewrite,
Sicherheits-Kopfzeilen, unveränderliche Zwischenspeicherung für
gehashte Dateien, dazu das **RTA-Label** — die Kennzeichnung, an der
Jugendschutzfilter erwachsene Inhalte erkennen.

```bash
npx vercel link          # einmalig; Root Directory: noira
npx vercel --prod
```

**Wichtig:** Dieses Repository enthält zwei Projekte (`noira/` und
`ramseier-verlag/`). In den Projekteinstellungen muss **Root
Directory = `noira`** stehen, sonst findet Vercel weder
`package.json` noch `vercel.json`.

Der SPA-Rewrite ist bewusst als `/((?!api/).*)` geschrieben: Ohne die
Ausnahme beantwortet Vercel einen Fehlgriff auf `/api/…` mit der
HTML-Seite statt mit einem Fehler — der Client bekäme dann `<!doctype
html>`, wo er JSON erwartet, und meldete einen Parser-Fehler statt
„nicht gefunden".

### Der Server läuft dort **nicht**

Das Backend hält Zustand auf der Platte: SQLite-Datei, hochgeladene
Fotos, verschlüsselte Ausweise. Vercels Funktionen haben ein
flüchtiges Dateisystem — nur `/tmp`, je Instanz eigen, beim nächsten
Kaltstart weg. Ein dorthin geschobener Server nähme Inserate
entgegen, verlöre sie und meldete dabei keinen Fehler. Das ist
schlimmer als gar kein Server.

Zwei gangbare Wege:

| | Was zu tun ist |
| --- | --- |
| **API auf einen dauerhaften Host** (Fly.io, Railway, Hetzner) | Nichts am Code. Volume für `var/`, `pnpm server:build`, `pnpm server:start`. Frontend bekommt die API-Adresse als `VITE_API_URL`. |
| **API auf Vercel** | Postgres (Neon/Vercel Postgres) statt SQLite und Blob-Speicher statt Dateisystem. Der Umbau ist vorbereitet — alle Abfragen laufen über `all/one/run/tx`, alle Dateizugriffe über vier Funktionen in `lib/storage.ts` — aber er ist echte Arbeit: `node:sqlite` ist synchron, Postgres nicht, also wird die Datenschicht asynchron und mit ihr jede Funktion darüber. |

Solange keiner der beiden Wege gegangen ist, zeigt die
ausgelieferte Seite den Demo-Datensatz aus `client/src/data/` — genau
das, was sie heute im Browser zeigt. Sie ist damit vollständig
bedienbar und vollständig unecht.

## 8. Was noch fehlt

Frontend und Backend stehen; der Demo-Datenbestand liegt weiterhin in
`client/src/data/` und wird von `pnpm seed` in die Datenbank übernommen.

Für den Livegang fehlen:

- **Anbindung der Zahlungsanbieter.** Die Schnittstelle steht (`PaymentProvider`,
  zwei Methoden), angebunden ist bislang nur der Demo-Anbieter. Datatrans
  (Karte, TWINT) und BTCPay (Krypto) passen dahinter.
- **Belegversand und E-Mail** überhaupt: Registrierungsbestätigung, Passwort
  zurücksetzen, Bescheid nach der Prüfung.
- **PostgreSQL statt SQLite** — der Umbau ist im Schema und in `db/index.ts`
  vorbereitet und dokumentiert.
- **Bildverarbeitung**: Skalierung, WebP/AVIF-Varianten, Entfernen der
  EXIF-Daten (Aufnahmeort!) beim Hochladen.
- **Fachübersetzung** der langen Texte in FR / IT / EN (Oberfläche ist übersetzt).
- **Rechtstexte anwaltlich prüfen**; kantonale Melde- und Bewilligungspflichten
  abbilden.
