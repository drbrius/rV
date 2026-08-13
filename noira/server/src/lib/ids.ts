/* Kennungen.

   Sortierbar nach Entstehungszeit (Zeitanteil vorne), aber nicht
   erratbar (80 Zufallsbits hinten) — anders als fortlaufende
   Zahlen, die verraten, wie viele Inserate es gibt und wie schnell
   sie wachsen. Alphabet ohne I, L, O, U: keine Verwechslung, wenn
   jemand eine Inserats-Nummer am Telefon durchgibt. */

import crypto from "node:crypto";

const ALPHABET = "0123456789ABCDEFGHJKMNPQRSTVWXYZ"; // Crockford Base32

function encode(bytes: Uint8Array): string {
  let bits = 0;
  let value = 0;
  let out = "";
  for (const byte of bytes) {
    value = (value << 8) | byte;
    bits += 8;
    while (bits >= 5) {
      out += ALPHABET[(value >>> (bits - 5)) & 31];
      bits -= 5;
    }
  }
  if (bits > 0) out += ALPHABET[(value << (5 - bits)) & 31];
  return out;
}

export function newId(prefix: string): string {
  const time = Buffer.alloc(6);
  time.writeUIntBE(Date.now(), 0, 6);
  return `${prefix}_${encode(time)}${encode(crypto.randomBytes(10))}`;
}

/** Fürs Inserat: kurz, sprechbar, in Meldungen zitierbar. */
export function newListingRef(): string {
  return `N-${encode(crypto.randomBytes(4)).slice(0, 6)}`;
}

/** Sitzungstoken: roh an die Kundschaft, gehasht in die Datenbank. */
export function newToken() {
  const raw = crypto.randomBytes(32).toString("base64url");
  return { raw, hash: hashToken(raw) };
}

export function hashToken(raw: string) {
  return crypto.createHash("sha256").update(raw).digest("hex");
}

/** Erzeugt aus einem Namen einen URL-Teil, ohne Umlaute zu verlieren. */
export function slugify(input: string): string {
  return input
    .toLowerCase()
    .replace(/ä/g, "ae")
    .replace(/ö/g, "oe")
    .replace(/ü/g, "ue")
    .replace(/ß/g, "ss")
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60);
}
