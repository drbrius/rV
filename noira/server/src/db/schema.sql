-- ============================================================
--  NOIRA — Datenmodell
--
--  Geschrieben für SQLite (node:sqlite, keine native Abhängigkeit),
--  aber absichtlich portabel gehalten: TEXT-Zeitstempel in ISO-8601,
--  INTEGER 0/1 als Wahrheitswert, Beträge in Rappen als INTEGER —
--  niemals Fliesskomma für Geld.
--
--  Für den Umstieg auf PostgreSQL sind genau drei Dinge zu ändern:
--    * TEXT PRIMARY KEY bleibt, INTEGER-Wahrheitswerte → BOOLEAN
--    * strftime(...) → to_char(...) in stats.ts
--    * PRAGMA-Zeilen entfallen
--  Alles Übrige ist gewöhnliches SQL.
-- ============================================================

-- --- Konten und Sitzungen -----------------------------------------

CREATE TABLE IF NOT EXISTS accounts (
  id              TEXT PRIMARY KEY,
  email           TEXT NOT NULL UNIQUE,
  password_hash   TEXT NOT NULL,
  role            TEXT NOT NULL DEFAULT 'advertiser'
                  CHECK (role IN ('advertiser', 'moderator', 'admin')),
  locale          TEXT NOT NULL DEFAULT 'de',
  created_at      TEXT NOT NULL,
  updated_at      TEXT NOT NULL,
  disabled_at     TEXT,
  disabled_reason TEXT
);

-- Sitzungen speichern nur den Hash des Tokens: Wer die Datenbank
-- liest, kann damit keine Sitzung übernehmen.
CREATE TABLE IF NOT EXISTS sessions (
  token_hash   TEXT PRIMARY KEY,
  account_id   TEXT NOT NULL REFERENCES accounts(id) ON DELETE CASCADE,
  created_at   TEXT NOT NULL,
  expires_at   TEXT NOT NULL,
  last_seen_at TEXT NOT NULL,
  user_agent   TEXT,
  ip_hash      TEXT
);
CREATE INDEX IF NOT EXISTS idx_sessions_account ON sessions(account_id);
CREATE INDEX IF NOT EXISTS idx_sessions_expiry ON sessions(expires_at);

-- Fehlversuche, für Sperren nach zu vielen Anläufen. Getrennt je
-- Konto und je Herkunft, damit ein Angriff auf ein Konto nicht die
-- ganze Anmeldung lahmlegt.
CREATE TABLE IF NOT EXISTS login_attempts (
  id         TEXT PRIMARY KEY,
  email      TEXT NOT NULL,
  ip_hash    TEXT NOT NULL,
  at         TEXT NOT NULL,
  successful INTEGER NOT NULL DEFAULT 0
);
CREATE INDEX IF NOT EXISTS idx_attempts_email_at ON login_attempts(email, at);
CREATE INDEX IF NOT EXISTS idx_attempts_ip_at ON login_attempts(ip_hash, at);

-- --- Inserate ------------------------------------------------------

CREATE TABLE IF NOT EXISTS listings (
  id            TEXT PRIMARY KEY,
  account_id    TEXT NOT NULL REFERENCES accounts(id) ON DELETE CASCADE,
  slug          TEXT NOT NULL UNIQUE,

  -- Der Lebenslauf eines Inserats. Nur 'active' ist öffentlich.
  status        TEXT NOT NULL DEFAULT 'draft'
                CHECK (status IN ('draft','pending_review','active','paused',
                                  'rejected','expired','suspended')),

  name          TEXT NOT NULL,
  age           INTEGER,
  category      TEXT NOT NULL,
  canton        TEXT NOT NULL,
  city          TEXT NOT NULL,
  tagline       TEXT NOT NULL DEFAULT '',
  about         TEXT NOT NULL DEFAULT '',

  incall        INTEGER NOT NULL DEFAULT 1,
  outcall       INTEGER NOT NULL DEFAULT 0,

  -- Tarife in Rappen; NULL heisst „nicht angeboten", nicht „gratis".
  rate_m30      INTEGER,
  rate_h1       INTEGER,
  rate_h2       INTEGER,
  rate_night    INTEGER,

  availability  TEXT NOT NULL DEFAULT '',
  phone         TEXT NOT NULL DEFAULT '',
  phone_hidden  INTEGER NOT NULL DEFAULT 0,

  has_video     INTEGER NOT NULL DEFAULT 0,
  -- Erreichbarkeits-Zeitstempel; „jetzt erreichbar" wird daraus
  -- berechnet, nicht als Wahrheitswert gespeichert, der veraltet.
  online_until  TEXT,

  plan          TEXT CHECK (plan IN ('basis','plus','premium')),
  published_at  TEXT,
  expires_at    TEXT,
  verified_at   TEXT,

  rejected_reason TEXT,
  moderated_by    TEXT REFERENCES accounts(id),
  moderated_at    TEXT,

  created_at    TEXT NOT NULL,
  updated_at    TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_listings_public
  ON listings(status, canton, category, published_at);
CREATE INDEX IF NOT EXISTS idx_listings_account ON listings(account_id);
CREATE INDEX IF NOT EXISTS idx_listings_expiry ON listings(status, expires_at);

-- Services und Sprachen normalisiert: nur so lässt sich „alle
-- gewählten Services" in SQL prüfen, statt in JSON zu suchen.
CREATE TABLE IF NOT EXISTS listing_services (
  listing_id TEXT NOT NULL REFERENCES listings(id) ON DELETE CASCADE,
  service    TEXT NOT NULL,
  PRIMARY KEY (listing_id, service)
);
CREATE INDEX IF NOT EXISTS idx_services_service ON listing_services(service);

CREATE TABLE IF NOT EXISTS listing_languages (
  listing_id TEXT NOT NULL REFERENCES listings(id) ON DELETE CASCADE,
  language   TEXT NOT NULL,
  PRIMARY KEY (listing_id, language)
);
CREATE INDEX IF NOT EXISTS idx_languages_language ON listing_languages(language);

CREATE TABLE IF NOT EXISTS listing_photos (
  id          TEXT PRIMARY KEY,
  listing_id  TEXT NOT NULL REFERENCES listings(id) ON DELETE CASCADE,
  storage_key TEXT NOT NULL,
  mime        TEXT NOT NULL,
  bytes       INTEGER NOT NULL,
  position    INTEGER NOT NULL DEFAULT 0,
  approved    INTEGER NOT NULL DEFAULT 0,
  created_at  TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_photos_listing ON listing_photos(listing_id, position);

-- --- Verifizierung -------------------------------------------------

-- Ausweis und Selfie liegen verschlüsselt im Dateispeicher; hier
-- stehen nur Schlüssel und Frist. purge_after ist der Grund, warum
-- diese Tabelle existiert: Löschen muss terminiert sein.
CREATE TABLE IF NOT EXISTS verifications (
  id            TEXT PRIMARY KEY,
  account_id    TEXT NOT NULL REFERENCES accounts(id) ON DELETE CASCADE,
  listing_id    TEXT REFERENCES listings(id) ON DELETE SET NULL,
  status        TEXT NOT NULL DEFAULT 'pending'
                CHECK (status IN ('pending','approved','rejected')),
  codeword      TEXT NOT NULL,
  doc_key       TEXT,
  selfie_key    TEXT,
  submitted_at  TEXT NOT NULL,
  reviewed_at   TEXT,
  reviewer_id   TEXT REFERENCES accounts(id),
  reject_reason TEXT,
  purge_after   TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_verifications_status ON verifications(status, submitted_at);
CREATE INDEX IF NOT EXISTS idx_verifications_purge ON verifications(purge_after);

-- --- Bestellungen und Zahlungen ------------------------------------

CREATE TABLE IF NOT EXISTS orders (
  id                TEXT PRIMARY KEY,
  account_id        TEXT NOT NULL REFERENCES accounts(id) ON DELETE CASCADE,
  listing_id        TEXT REFERENCES listings(id) ON DELETE SET NULL,
  plan              TEXT NOT NULL CHECK (plan IN ('basis','plus','premium')),
  duration_days     INTEGER NOT NULL CHECK (duration_days IN (7,30,90)),

  -- Alles in Rappen. Der Steuersatz wird mitgeschrieben, weil er
  -- sich ändern kann und alte Belege gültig bleiben müssen.
  amount_net        INTEGER NOT NULL,
  vat_rate_bp       INTEGER NOT NULL,
  vat_amount        INTEGER NOT NULL,
  amount_total      INTEGER NOT NULL,
  currency          TEXT NOT NULL DEFAULT 'CHF',

  method            TEXT NOT NULL CHECK (method IN ('card','twint','crypto')),
  status            TEXT NOT NULL DEFAULT 'created'
                    CHECK (status IN ('created','pending','paid','failed','expired','refunded')),
  provider          TEXT NOT NULL,
  provider_ref      TEXT,

  crypto_asset      TEXT,
  crypto_amount     TEXT,
  rate_locked_until TEXT,

  invoice_email     TEXT NOT NULL,
  invoice_address   TEXT,

  created_at        TEXT NOT NULL,
  paid_at           TEXT,
  failed_reason     TEXT
);
CREATE INDEX IF NOT EXISTS idx_orders_account ON orders(account_id, created_at);
CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status);
CREATE UNIQUE INDEX IF NOT EXISTS idx_orders_provider_ref
  ON orders(provider, provider_ref) WHERE provider_ref IS NOT NULL;

-- Rohe Ereignisse des Zahlungsanbieters. provider_event_id ist
-- eindeutig — das ist die Idempotenz: Ein zweimal geliefertes
-- Ereignis schaltet nicht zweimal frei.
CREATE TABLE IF NOT EXISTS payment_events (
  id                TEXT PRIMARY KEY,
  order_id          TEXT REFERENCES orders(id) ON DELETE SET NULL,
  provider          TEXT NOT NULL,
  provider_event_id TEXT NOT NULL,
  type              TEXT NOT NULL,
  payload           TEXT NOT NULL,
  received_at       TEXT NOT NULL,
  processed_at      TEXT,
  error             TEXT,
  UNIQUE (provider, provider_event_id)
);

-- --- Meldungen und Protokoll ---------------------------------------

CREATE TABLE IF NOT EXISTS reports (
  id            TEXT PRIMARY KEY,
  listing_id    TEXT REFERENCES listings(id) ON DELETE SET NULL,
  listing_ref   TEXT,
  kind          TEXT NOT NULL
                CHECK (kind IN ('coercion','minor','stolen_photos','fraud','harassment','other')),
  message       TEXT NOT NULL,
  reporter_email TEXT,
  ip_hash       TEXT,
  status        TEXT NOT NULL DEFAULT 'open'
                CHECK (status IN ('open','in_review','actioned','dismissed')),
  created_at    TEXT NOT NULL,
  handled_at    TEXT,
  handled_by    TEXT REFERENCES accounts(id),
  action_note   TEXT
);
-- Meldungen zu Zwang und Minderjährigen zuerst: die Sortierung
-- gehört in den Index, nicht in die Hoffnung.
CREATE INDEX IF NOT EXISTS idx_reports_open ON reports(status, kind, created_at);

CREATE TABLE IF NOT EXISTS audit_log (
  id           TEXT PRIMARY KEY,
  actor_id     TEXT,
  actor_kind   TEXT NOT NULL,
  action       TEXT NOT NULL,
  subject_type TEXT,
  subject_id   TEXT,
  meta         TEXT,
  at           TEXT NOT NULL,
  ip_hash      TEXT
);
CREATE INDEX IF NOT EXISTS idx_audit_subject ON audit_log(subject_type, subject_id, at);

-- --- Kennzahlen ----------------------------------------------------

-- Tagesweise verdichtet statt eine Zeile je Aufruf: Für die
-- Statistik der Inserierenden genügt das, und die Tabelle wächst
-- linear mit Tagen statt mit Besuchen.
CREATE TABLE IF NOT EXISTS listing_daily_stats (
  listing_id TEXT NOT NULL REFERENCES listings(id) ON DELETE CASCADE,
  day        TEXT NOT NULL,
  views      INTEGER NOT NULL DEFAULT 0,
  reveals    INTEGER NOT NULL DEFAULT 0,
  PRIMARY KEY (listing_id, day)
);
