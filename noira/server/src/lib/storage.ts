/* ============================================================
   Dateispeicher

   Zwei Ablagen mit verschiedenen Regeln:

   • Fotos liegen im Klartext. Sie sollen ausgeliefert werden;
     Verschlüsselung brächte nichts ausser Aufwand.

   • Ausweise und Verifizierungs-Selfies liegen verschlüsselt
     (AES-256-GCM, eigener Zufallsvektor je Datei). Sie sollen nie
     ausgeliefert werden, nur von zwei Personen im Prüfteam
     angesehen — und nach Ablauf verschwinden.

   Der Schlüssel steht in der Umgebung, nicht in der Datenbank. Wer
   eine Sicherung der Datenbank erbeutet, hat damit keine Ausweise.

   Für den Betrieb tritt hier S3 an die Stelle des Dateisystems; die
   vier Funktionen unten sind die ganze Schnittstelle.
   ============================================================ */

import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import { env } from "../env.js";

const PUBLIC = "public";
const SECURE = "secure";

function resolve(area: string, key: string) {
  // Kein Ausbrechen aus dem Ablageverzeichnis über ../ im Schlüssel.
  const safe = key.replace(/[^a-zA-Z0-9._-]/g, "");
  if (!safe || safe !== key) throw new Error(`Ungültiger Speicherschlüssel: ${key}`);
  return path.join(env.storageDir, area, safe);
}

function ensureDir(file: string) {
  fs.mkdirSync(path.dirname(file), { recursive: true });
}

/** Foto ablegen. Liefert den Schlüssel, unter dem es wieder auffindbar ist. */
export function putPublic(key: string, data: Buffer): string {
  const file = resolve(PUBLIC, key);
  ensureDir(file);
  fs.writeFileSync(file, data);
  return key;
}

export function readPublic(key: string): Buffer | null {
  const file = resolve(PUBLIC, key);
  return fs.existsSync(file) ? fs.readFileSync(file) : null;
}

/** Ausweis oder Selfie: verschlüsselt ablegen. */
export function putSecure(key: string, data: Buffer): string {
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv("aes-256-gcm", env.documentKey, iv);
  const body = Buffer.concat([cipher.update(data), cipher.final()]);
  const tag = cipher.getAuthTag();

  const file = resolve(SECURE, key);
  ensureDir(file);
  // iv | tag | chiffrat — alles, was zum Entschlüsseln nötig ist,
  // ausser dem Schlüssel selbst.
  fs.writeFileSync(file, Buffer.concat([iv, tag, body]));
  return key;
}

export function readSecure(key: string): Buffer | null {
  const file = resolve(SECURE, key);
  if (!fs.existsSync(file)) return null;
  const raw = fs.readFileSync(file);
  const iv = raw.subarray(0, 12);
  const tag = raw.subarray(12, 28);
  const decipher = crypto.createDecipheriv("aes-256-gcm", env.documentKey, iv);
  decipher.setAuthTag(tag);
  // Schlägt fehl, wenn jemand die Datei verändert hat — das ist der
  // Sinn von GCM und darf laut werden.
  return Buffer.concat([decipher.update(raw.subarray(28)), decipher.final()]);
}

export function removeSecure(key: string): boolean {
  const file = resolve(SECURE, key);
  if (!fs.existsSync(file)) return false;
  fs.rmSync(file);
  return true;
}

export function removePublic(key: string): boolean {
  const file = resolve(PUBLIC, key);
  if (!fs.existsSync(file)) return false;
  fs.rmSync(file);
  return true;
}
