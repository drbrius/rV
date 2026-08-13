# NOIRA — Gesamtdokumentation

> Erzeugt aus `README.md` und `server/README.md` mit `pnpm export:doc`.
> Stand: 2026-08-13. Nicht von Hand ändern — die Quellen sind die zwei READMEs.

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
VITE_BASE=/rv/ pnpm build:pages   # Build für GitHub Pages (Unterpfad)
VITE_BASE=/rv/ pnpm check:pages   # Probe gegen einen Pages-Nachbau

# Server
pnpm seed          # Demo-Datenbestand: 28 Inserate, Bilder, 3 Konten
pnpm server        # http://localhost:4000
pnpm test          # 55 Tests
pnpm check:server  # Typprüfung des Servers

# Dokumentation
pnpm export:doc    # NOIRA-Dokumentation.md — beide READMEs in einer Datei
```

Der Serverteil steht vollständig in Abschnitt 7.

`pnpm bundle` faltet JS, CSS, Schriften und Favicon in eine einzige HTML-Datei
und schaltet die Routen auf Hash-Navigation um. Damit läuft die ganze Seite ohne
Server — per Doppelklick, als Anhang oder als geteilte Vorschau. Für die
reguläre Auslieferung bleibt `pnpm build` mit sauberen Pfaden.

---

## Inhalt

1. [Analyse der Referenzen](#1-analyse-der-referenzen)
2. [Positionierung von NOIRA](#2-positionierung-von-noira)
3. [Marke: die Eklipse](#3-marke-die-eklipse)
4. [Mehrsprachigkeit](#4-mehrsprachigkeit)
5. [Seiten und Informationsarchitektur](#5-seiten-und-informationsarchitektur)
6. [Zahlung](#6-zahlung)
7. [Der Server](#7-der-server)
8. [Auslieferung](#8-auslieferung)
9. [Was noch fehlt](#9-was-noch-fehlt)

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

## 7. Der Server

Das Backend zur Oberfläche in `client/`. Fastify 5, TypeScript,
SQLite über `node:sqlite`. Keine native Abhängigkeit, kein Dienst,
der erst gestartet werden muss: `pnpm seed && pnpm server` genügt.

```
pnpm seed          # Demo-Datenbestand anlegen (28 Inserate, 3 Konten)
pnpm server        # Server auf http://localhost:4000
pnpm server:dev    # dasselbe, mit Neustart bei Änderungen
pnpm test          # 55 Tests
pnpm check:server  # Typprüfung
pnpm server:build  # nach dist-server/ übersetzen
```

Die Demo-Konten stehen nach dem Seed-Lauf auf der Konsole.

---

### Wie das Ganze aufgebaut ist

```
src/
  env.ts              Konfiguration, beim Start geprüft
  app.ts              Fastify-Instanz (ohne listen — für Tests)
  index.ts            Startpunkt
  jobs.ts             wiederkehrende Arbeiten
  db/                 Verbindung, Schema
  lib/                Kennungen, Passwörter, Dateispeicher, Fehler
  domain/             die Regeln — ohne HTTP
  routes/             HTTP — ohne Regeln
```

Die Trennung zwischen `domain/` und `routes/` ist die einzige
Struktur­entscheidung, die hier wirklich zählt. Die Regeln
(«unter 18 kein Inserat», «bezahlt heisst nicht veröffentlicht»,
«eine Ablehnung braucht einen Grund») stehen in `domain/` und sind
ohne HTTP testbar. Die Routen prüfen Eingaben, holen die Sitzung und
rufen die Regeln auf. Wer eine Regel sucht, sucht sie nur an einem
Ort.

---

### Die vier Entscheidungen, die das Verhalten prägen

**1. Geld sind Ganzzahlen in Rappen.** `79.90` ist als Fliesskomma
nicht darstellbar, `7990` als Ganzzahl exakt. Der Preis kommt aus
`domain/catalog.ts`, nie aus der Anfrage — was der Browser schickt,
ist ein Wunsch. Die Mehrwertsteuer wird auf 5 Rappen gerundet und
mit dem damals geltenden Satz in der Bestellung mitgeschrieben,
damit alte Belege gültig bleiben.

**2. Veröffentlichen braucht zwei Bedingungen.** Bezahlte Laufzeit
*und* bestandene Prüfung — in beliebiger Reihenfolge eintreffend.
Zusammengeführt werden sie an genau einer Stelle: `publishIfReady()`
in `domain/ads.ts`. Wer zahlt und dann geprüft wird, geht bei der
Freigabe live; wer geprüft wird und dann zahlt, geht mit der Zahlung
live. Bezahlen schaltet nichts frei, was die Prüfung nicht gesehen
hat.

**3. Zahlungsereignisse kommen doppelt.** Jeder Anbieter wiederholt
bei ausbleibender Bestätigung. `payment_events.provider_event_id`
ist eindeutig; das zweite «bezahlt» verlängert die Laufzeit nicht
ein zweites Mal. Die Signatur wird über den *rohen* Rumpf geprüft,
nicht über das neu serialisierte JSON.

**4. Ausweise sind eine Last, kein Guthaben.** Sie liegen
verschlüsselt (AES-256-GCM) ausserhalb der Datenbank, sind über
keine öffentliche URL erreichbar, werden nur bei laufenden Vorgängen
herausgegeben, jeder Abruf steht im Protokoll — und 90 Tage nach
Ablauf des letzten Inserats löscht `purgeExpired()` sie. Die Frist
steht in der Zeile und wird der einreichenden Person in der Antwort
genannt.

---

### Die Endpunkte

#### Öffentlich

| | |
|---|---|
| `GET /api/health` | Lebenszeichen |
| `GET /api/catalog` | Kantone, Kategorien, Services, Sprachen, Pakete mit fertig gerechneten Preisen, Codewort des Tages |
| `GET /api/stats` | Zahlen für Startseite und Fusszeile |
| `GET /api/listings` | Suche — siehe Filter unten |
| `GET /api/listings/:slug` | Detailansicht, zählt einen Aufruf |
| `POST /api/listings/:slug/kontakt` | gibt die Nummer heraus und zählt das |
| `POST /api/reports` | Meldung, ohne Anmeldung |
| `GET /api/media/:key` | Bild (nur freigegebene öffentlich) |

Filter der Suche, mit denselben Namen wie in der URL der Oberfläche:
`q`, `kanton`, `kategorie`, `services`, `sprachen`, `verifiziert`,
`video`, `online`, `empfang`, `besuch`, `preis` (Höchstpreis pro
Stunde in Rappen), `sortierung`, `page`, `limit`.

Zwei Verknüpfungen, die absichtlich unsymmetrisch sind: **Services
mit UND** (wer drei ankreuzt, will alle drei), **Sprachen mit ODER**
(wer Deutsch *oder* Französisch spricht, passt).

`sortierung=relevanz` ist offengelegt: bezahlte Platzierung, dann
Verifizierung, dann Aktualität. Keine geheime Gewichtung.

#### Anmeldung

`POST /api/auth/registrieren` · `POST /api/auth/anmelden` ·
`POST /api/auth/abmelden` · `POST /api/auth/alle-abmelden` ·
`GET /api/auth/ich`

Die Sitzung steckt in einem `httpOnly`-Cookie mit `SameSite=Lax`; in
der Datenbank liegt nur der Hash des Tokens. Fehlversuche werden
getrennt je Konto (8) und je Herkunft (25) in einem
15-Minuten-Fenster gezählt — sonst legt ein Angriff auf ein Konto
die Anmeldung für alle lahm, oder ein Angriff aus einem Netz sperrt
reihenweise fremde Konten aus. Unbekannte Adressen werden gegen
einen erfundenen Hash geprüft, damit die Antwortzeit nicht verrät,
wer registriert ist.

#### Inserierende (`/api/me/…`)

Inserate anlegen, ändern, einreichen, pausieren, «jetzt erreichbar»
setzen, löschen · Fotos hochladen, umsortieren, entfernen ·
Verifizierung einreichen · Bestellungen anlegen und ansehen ·
Statistik je Inserat und über alle.

Inhaltliche Änderungen an einem aktiven Inserat setzen es zurück auf
`pending_review`. Ohne diese Regel liesse sich ein freigegebenes
Inserat nachträglich in etwas anderes verwandeln.

Der Dateityp hochgeladener Bilder wird an den ersten Bytes erkannt,
nicht am mitgeschickten `Content-Type` — der ist eine Behauptung.

#### Prüfung und Verwaltung (`/api/admin/…`)

Prüfwarteschlange, Freigabe, Ablehnung (mit Pflichtbegründung),
Sperrung, Einzelbild-Entscheidungen, Meldungen, Verifizierungen,
Ausweiseinsicht, Kontosperre (nur `admin`), Verlauf je Inserat.

Meldungen wegen **Zwang** oder **Minderjährigkeit** nehmen das
Inserat sofort offline, bevor ein Mensch draufschaut, und stehen in
der Warteschlange vorn. Ein zu Unrecht gesperrtes Inserat kostet
Geld; das andere Versäumnis kostet mehr. Freigeben lässt sich ein
Inserat nicht, solange eine solche Meldung offen ist.

#### Zahlungen

`POST /api/payments/webhook/:provider` — ohne Sitzung, über Signatur
berechtigt. Ausserhalb des Betriebs zusätzlich
`POST /api/payments/simulieren`, um den Weg «bezahlt →
freigeschaltet» ohne echten Anbieter durchzuspielen; in Produktion
existiert die Route nicht.

Angebunden ist bislang `mock`. Die Schnittstelle `PaymentProvider`
(zwei Methoden: Zahlung eröffnen, Ereignis prüfen) ist so
geschnitten, dass Datatrans (Karte, TWINT) und BTCPay (Krypto)
dahinter passen. `providerFor()` wirft, wenn ein Anbieter nicht
angebunden ist, statt still auf die Demo zurückzufallen: Eine
Bestellung, die niemand kassiert, ist schlimmer als ein Fehler.

---

### Fehlerantworten

Alle Fehler folgen RFC 9457 (`application/problem+json`):

```json
{
  "type": "https://noira.ch/fehler/bad_request",
  "title": "Eingaben unvollständig.",
  "status": 400,
  "code": "bad_request",
  "errors": { "about": "Beschreibung zwischen 80 und 1200 Zeichen." }
}
```

`errors` trägt die Feldfehler des Formulars. Nach aussen geht nie
ein Stacktrace; was schiefging, steht im Protokoll.

Ein Detail, das leicht schiefgeht und hier absichtlich anders
gelöst ist: Der Fehler-Handler wird **vor** den Routen registriert.
Ein `setErrorHandler` nach `register` erreicht die bereits erzeugten
Unterkontexte nicht mehr — die Routen antworten dann im
Fastify-Standardformat, und weil die Statuscodes stimmen, merkt es
niemand.

---

### Wartung

`jobs.ts` läuft alle 15 Minuten im selben Prozess und hält vier
Versprechen ein, die sonst nur auf der Website stünden: abgelaufene
Inserate verschwinden aus der Suche, unbezahlte Bestellungen
schliessen sich nach 24 Stunden, alte Sitzungen und Anmeldeversuche
werden gelöscht, Ausweisunterlagen nach Ablauf der Frist entfernt.
Alle vier sind wiederholbar; ein zweiter Durchlauf macht nichts
kaputt. Bei mehreren Instanzen gehört das in einen eigenen Dienst
mit Sperre.

---

### Von SQLite nach PostgreSQL

Bewusst klein gehalten. Alle Abfragen laufen über `all/one/run/tx`
in `db/index.ts`, das SQL ist portabel geschrieben: ISO-8601 in
`TEXT`, Wahrheitswerte als `INTEGER 0/1`, Beträge als `INTEGER`.
Zu ändern sind drei Dinge — die `INTEGER`-Wahrheitswerte werden
`BOOLEAN`, die `PRAGMA`-Zeilen entfallen, und der
Fremdschlüssel-Schalter wird überflüssig (in SQLite ist er je
Verbindung standardmässig **aus**; ohne die Zeile wären alle
`REFERENCES` im Schema Dekoration).

Gleiches gilt für den Dateispeicher: `lib/storage.ts` hat vier
Funktionen, hinter denen statt des Dateisystems S3 stehen kann.

---

### Tests

```
pnpm test
```

55 Tests in fünf Dateien, jede in eigenem Prozess mit eigener
Datenbank im Arbeitsspeicher:

- `pricing` — Rappen, Steuerrundung, Staffelung der Pakete
- `journey` — der ganze Weg vom Konto bis zum sichtbaren Inserat
- `security` — Passwörter, Anmeldeschutz, Sitzungen, Kopfzeilen
- `moderation` — Meldungen, Sperren, Verifizierung, Löschfristen
- `search` — Filter, Sortierung, Blättern, Wartung

Was diese Tests prüfen, ist nicht Abdeckung um der Abdeckung willen:
Es sind die Versprechen der Website. Dass Ausweise nach der Frist
wirklich von der Platte verschwinden, steht als Test in
`moderation.test.ts` — ein Versprechen ohne Test ist eine
Absichtserklärung.

---

## 8. Auslieferung

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

### Oberfläche auf GitHub Pages

Zweiter Auslieferungsweg, unabhängig von Vercel. Der Ablauf
`.github/workflows/pages.yml` baut, prüft und lädt hoch.

**Einmalig von Hand:** *Settings → Pages → Source* auf **GitHub
Actions** stellen. Kein Ablauf darf sich das selbst einschalten.

Danach läuft die Auslieferung bei jedem Push auf `noira/**`; die
Seite steht unter `https://<konto>.github.io/rv/`.

Pages liefert Projektseiten unter `/<repo>/` aus statt an der
Wurzel. Drei Stellen mussten das lernen:

| | |
| --- | --- |
| **Dateipfade** | `VITE_BASE` setzt Vites `base`; Skript, Stilblatt, Favicon und die acht Schriftdateien bekommen das Stück vorangestellt — auch die `url()` in den `@font-face`. |
| **Routen** | Der Router liest `import.meta.env.BASE_URL`. Ohne das sucht er nach `/rv/inserate` eine Route dieses Namens und findet nur `/inserate`. |
| **Tiefe Links** | Pages kennt keine Rewrites. `404.html` ist eine Kopie von `index.html`: Pages liefert sie für unbekannte Pfade aus, die Anwendung startet, liest den Pfad und zeigt die richtige Seite. Der Statuscode bleibt 404 — daran lässt sich auf Pages nichts ändern. |

`scripts/check-pages.mjs` widerlegt alle drei Fehler vor dem
Hochladen: ein Dateiserver, der sich wie Pages verhält, dazu ein
echter Browser, der Startseite, tiefen Link und einen Klick prüft.
Der Ablauf führt dieselbe Probe aus.

Zwei Unterschiede zu Vercel, die bleiben:

- **Keine Kopfzeilen.** Pages setzt keine eigenen. Damit fehlen HSTS,
  Permissions-Policy und vor allem das `Rating`-Feld für
  Jugendschutzfilter. Im HTML steht `<meta name="rating"
  content="adult">` — das ist, was ohne Serverkontrolle geht.
- **Nicht indexierbar.** Der Pages-Build überschreibt `robots.txt`
  mit `Disallow: /`. Unter `github.io` steht eine Vorschau; in den
  Suchindex gehört sie nicht.

> GitHub Pages ist laut Nutzungsbedingungen nicht für Seiten
> gedacht, die vorrangig geschäftliche Abschlüsse abwickeln. Als
> Entwurfsvorschau ist das unstrittig, als Betriebsplattform für
> NOIRA wäre es der falsche Ort — dafür stehen Vercel und eine
> eigene Domain bereit.

### Der Server läuft dort **nicht**

Weder auf Vercel noch auf Pages. Das Backend hält Zustand auf der
Platte: SQLite-Datei, hochgeladene Fotos, verschlüsselte Ausweise.
Pages ist ein reiner Dateiserver und führt überhaupt nichts aus;
Vercels Funktionen haben ein flüchtiges Dateisystem — nur `/tmp`, je Instanz eigen, beim nächsten
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

## 9. Was noch fehlt

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
