/* Passwörter.

   scrypt aus node:crypto statt Argon2 als Abhängigkeit: Es ist
   speicherhart, in der Standardbibliothek und braucht keinen
   nativen Baustein, der auf einem fremden Rechner bricht.

   Der Pfeffer aus der Konfiguration liegt im Prozess, nicht in der
   Datenbank — wer nur die Datenbank erbeutet, hat damit noch keine
   offline knackbaren Hashes.

   Format: scrypt$N$r$p$salt$hash — die Parameter stehen im Hash,
   damit sie später erhöht werden können, ohne alte Konten
   auszusperren. */

import crypto from "node:crypto";
import { env } from "../env.js";

const N = 2 ** 15; // ~32 MB Speicher je Prüfung
const r = 8;
const p = 1;
const KEYLEN = 32;

function derive(password: string, salt: Buffer, n: number, rr: number, pp: number): Buffer {
  return crypto.scryptSync(password + env.passwordPepper, salt, KEYLEN, {
    N: n,
    r: rr,
    p: pp,
    // Ohne dieses Limit lehnt Node die obigen Parameter ab.
    maxmem: 256 * 1024 * 1024,
  });
}

export function hashPassword(password: string): string {
  const salt = crypto.randomBytes(16);
  const hash = derive(password, salt, N, r, p);
  return ["scrypt", N, r, p, salt.toString("base64"), hash.toString("base64")].join("$");
}

export function verifyPassword(password: string, stored: string): boolean {
  const parts = stored.split("$");
  if (parts.length !== 6 || parts[0] !== "scrypt") return false;
  const [, n, rr, pp, saltB64, hashB64] = parts;
  const expected = Buffer.from(hashB64, "base64");
  let actual: Buffer;
  try {
    actual = derive(password, Buffer.from(saltB64, "base64"), Number(n), Number(rr), Number(pp));
  } catch {
    return false;
  }
  // Längenvergleich vorab: timingSafeEqual wirft bei ungleicher Länge.
  if (actual.length !== expected.length) return false;
  return crypto.timingSafeEqual(actual, expected);
}

/** Erkennt Hashes mit veralteten Parametern, für stilles Nachziehen bei der Anmeldung. */
export function needsRehash(stored: string): boolean {
  const parts = stored.split("$");
  return parts.length !== 6 || parts[0] !== "scrypt" || Number(parts[1]) < N;
}
