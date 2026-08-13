/* ============================================================
   Konfiguration
   Alles, was sich zwischen Entwicklung und Betrieb unterscheidet,
   steht hier — und wird beim Start geprüft, nicht beim ersten
   Zugriff. Ein Server, der ohne Verschlüsselungsschlüssel
   hochfährt und erst beim ersten Ausweis-Upload merkt, dass er
   keinen hat, ist schlimmer als einer, der gar nicht startet.
   ============================================================ */

import crypto from "node:crypto";
import path from "node:path";
import { z } from "zod";

const schema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  PORT: z.coerce.number().int().positive().default(4000),
  HOST: z.string().default("0.0.0.0"),

  /** Ablageort der Datenbank. ":memory:" für Tests. */
  DATABASE_PATH: z.string().default("var/noira.db"),
  /** Verzeichnis für Fotos und Verifizierungsunterlagen. */
  STORAGE_DIR: z.string().default("var/storage"),

  /** Basis für Cookie-Domain und Weiterleitungen. */
  PUBLIC_ORIGIN: z.string().url().default("http://localhost:3000"),

  /* 32 Byte, hex- oder base64-kodiert. Verschlüsselt Ausweis- und
     Selfie-Dateien im Ruhezustand (AES-256-GCM). */
  DOCUMENT_KEY: z.string().optional(),

  /* Pfeffer für Passwort-Hashes: liegt im Prozess, nicht in der
     Datenbank. Wer nur die Datenbank erbeutet, hat damit noch
     keine offline knackbaren Hashes. */
  PASSWORD_PEPPER: z.string().optional(),

  /** Salz für IP-Hashes in Protokollen — nie die IP im Klartext. */
  IP_HASH_SALT: z.string().optional(),

  /** Zahlungsanbieter: "mock" bis Datatrans/BTCPay angebunden sind. */
  PAYMENT_PROVIDER: z.enum(["mock", "datatrans", "btcpay"]).default("mock"),
  PAYMENT_WEBHOOK_SECRET: z.string().optional(),
});

const parsed = schema.safeParse(process.env);
if (!parsed.success) {
  console.error("Konfiguration unbrauchbar:\n" + z.prettifyError(parsed.error));
  process.exit(1);
}

const raw = parsed.data;
const isProd = raw.NODE_ENV === "production";

/** Nimmt hex oder base64 und liefert genau 32 Byte. */
function keyFrom(value: string | undefined, name: string): Buffer {
  if (!value) {
    if (isProd) {
      console.error(`${name} fehlt. Im Betrieb ist das kein Standardwert wert.`);
      process.exit(1);
    }
    // Entwicklung: aus dem Namen abgeleitet, damit Neustarts dieselben
    // Dateien noch entschlüsseln können. Niemals im Betrieb.
    return crypto.createHash("sha256").update(`noira-dev-${name}`).digest();
  }
  const buf = /^[0-9a-f]{64}$/i.test(value)
    ? Buffer.from(value, "hex")
    : Buffer.from(value, "base64");
  if (buf.length !== 32) {
    console.error(`${name} muss 32 Byte lang sein (hex oder base64), ist ${buf.length}.`);
    process.exit(1);
  }
  return buf;
}

/* Relative Pfade zählen ab dem Arbeitsverzeichnis, nicht ab dem
   Ort dieser Datei. Sonst zeigen sie nach dem Bauen woanders hin
   als im Betrieb aus den Quellen — die Datei liegt dann eine Ebene
   flacher, und der Server legt seine Datenbank neben das Projekt
   statt hinein. */
const root = process.cwd();

export const env = {
  ...raw,
  isProd,
  isTest: raw.NODE_ENV === "test",
  databasePath:
    raw.DATABASE_PATH === ":memory:" ? ":memory:" : path.resolve(root, raw.DATABASE_PATH),
  storageDir: path.resolve(root, raw.STORAGE_DIR),
  documentKey: keyFrom(raw.DOCUMENT_KEY, "DOCUMENT_KEY"),
  passwordPepper: raw.PASSWORD_PEPPER ?? (isProd ? "" : "noira-dev-pepper"),
  ipHashSalt: raw.IP_HASH_SALT ?? (isProd ? "" : "noira-dev-ip-salt"),
} as const;

if (isProd && (!env.passwordPepper || !env.ipHashSalt)) {
  console.error("PASSWORD_PEPPER und IP_HASH_SALT sind im Betrieb Pflicht.");
  process.exit(1);
}
