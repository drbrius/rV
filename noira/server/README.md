# NOIRA — Server

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

## Wie das Ganze aufgebaut ist

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

## Die vier Entscheidungen, die das Verhalten prägen

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

## Die Endpunkte

### Öffentlich

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

### Anmeldung

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

### Inserierende (`/api/me/…`)

Inserate anlegen, ändern, einreichen, pausieren, «jetzt erreichbar»
setzen, löschen · Fotos hochladen, umsortieren, entfernen ·
Verifizierung einreichen · Bestellungen anlegen und ansehen ·
Statistik je Inserat und über alle.

Inhaltliche Änderungen an einem aktiven Inserat setzen es zurück auf
`pending_review`. Ohne diese Regel liesse sich ein freigegebenes
Inserat nachträglich in etwas anderes verwandeln.

Der Dateityp hochgeladener Bilder wird an den ersten Bytes erkannt,
nicht am mitgeschickten `Content-Type` — der ist eine Behauptung.

### Prüfung und Verwaltung (`/api/admin/…`)

Prüfwarteschlange, Freigabe, Ablehnung (mit Pflichtbegründung),
Sperrung, Einzelbild-Entscheidungen, Meldungen, Verifizierungen,
Ausweiseinsicht, Kontosperre (nur `admin`), Verlauf je Inserat.

Meldungen wegen **Zwang** oder **Minderjährigkeit** nehmen das
Inserat sofort offline, bevor ein Mensch draufschaut, und stehen in
der Warteschlange vorn. Ein zu Unrecht gesperrtes Inserat kostet
Geld; das andere Versäumnis kostet mehr. Freigeben lässt sich ein
Inserat nicht, solange eine solche Meldung offen ist.

### Zahlungen

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

## Fehlerantworten

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

## Wartung

`jobs.ts` läuft alle 15 Minuten im selben Prozess und hält vier
Versprechen ein, die sonst nur auf der Website stünden: abgelaufene
Inserate verschwinden aus der Suche, unbezahlte Bestellungen
schliessen sich nach 24 Stunden, alte Sitzungen und Anmeldeversuche
werden gelöscht, Ausweisunterlagen nach Ablauf der Frist entfernt.
Alle vier sind wiederholbar; ein zweiter Durchlauf macht nichts
kaputt. Bei mehreren Instanzen gehört das in einen eigenen Dienst
mit Sperre.

---

## Von SQLite nach PostgreSQL

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

## Tests

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
