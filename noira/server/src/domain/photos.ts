/* ============================================================
   Fotos

   Drei Dinge, die hier ernst genommen werden:

   • Die Mengenbegrenzung kommt aus dem Paket, nicht aus dem
     Formular. Ohne Paket gilt die kleinste Stufe.
   • Der Dateityp wird an den ersten Bytes erkannt, nicht am
     mitgeschickten `Content-Type`. Der ist eine Behauptung.
   • Neue Fotos sind nicht freigegeben. Sie erscheinen erst, wenn
     die Prüfung sie freigibt — sonst liesse sich ein geprüftes
     Inserat nachträglich mit anderen Bildern füllen.
   ============================================================ */

import { all, one, run } from "../db/index.js";
import { badRequest, conflict, forbidden, notFound, nowIso } from "../lib/http.js";
import { newId } from "../lib/ids.js";
import { putPublic, removePublic } from "../lib/storage.js";
import { PLANS, type PlanId } from "./catalog.js";

const MAX_BYTES = 8 * 1024 * 1024;

/** Signaturen statt Vertrauen: die ersten Bytes verraten das Format. */
const SIGNATURES: { ext: string; mime: string; test: (b: Buffer) => boolean }[] = [
  { ext: "jpg", mime: "image/jpeg", test: (b) => b[0] === 0xff && b[1] === 0xd8 && b[2] === 0xff },
  {
    ext: "png",
    mime: "image/png",
    test: (b) => b.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])),
  },
  {
    ext: "webp",
    mime: "image/webp",
    test: (b) => b.subarray(0, 4).toString() === "RIFF" && b.subarray(8, 12).toString() === "WEBP",
  },
  {
    ext: "avif",
    mime: "image/avif",
    test: (b) => b.subarray(4, 8).toString() === "ftyp" && b.subarray(8, 12).toString().startsWith("avi"),
  },
];

export function detectImage(data: Buffer) {
  const hit = SIGNATURES.find((s) => data.length > 12 && s.test(data));
  if (!hit) throw badRequest("Nur JPEG, PNG, WebP oder AVIF.");
  return hit;
}

type PhotoRow = {
  id: string;
  listing_id: string;
  storage_key: string;
  mime: string;
  bytes: number;
  position: number;
  approved: number;
  created_at: string;
};

function ownListing(accountId: string, listingId: string) {
  const row = one<{ account_id: string; plan: string | null }>(
    "SELECT account_id, plan FROM listings WHERE id = ?",
    [listingId],
  );
  if (!row) throw notFound("Inserat nicht gefunden.");
  if (row.account_id !== accountId) throw forbidden("Das ist nicht Ihr Inserat.");
  return row;
}

export function addPhoto(
  accountId: string,
  listingId: string,
  data: Buffer,
): { id: string; url: string; approved: boolean; position: number } {
  const listing = ownListing(accountId, listingId);

  if (data.length === 0) throw badRequest("Die Datei ist leer.");
  if (data.length > MAX_BYTES) throw badRequest("Höchstens 8 MB je Bild.");
  const kind = detectImage(data);

  const limit = PLANS[(listing.plan as PlanId) ?? "basis"].photos;
  const count = one<{ n: number }>(
    "SELECT COUNT(*) AS n FROM listing_photos WHERE listing_id = ?",
    [listingId],
  )!.n;
  if (count >= limit)
    throw conflict(`Dieses Paket erlaubt ${limit} Bilder. Für mehr braucht es ein grösseres Paket.`);

  const id = newId("pho");
  const key = `${id}.${kind.ext}`;
  putPublic(key, data);

  const position = (
    one<{ p: number | null }>(
      "SELECT MAX(position) AS p FROM listing_photos WHERE listing_id = ?",
      [listingId],
    )!.p ?? -1
  ) + 1;

  run(
    `INSERT INTO listing_photos (id, listing_id, storage_key, mime, bytes, position, approved, created_at)
     VALUES (?, ?, ?, ?, ?, ?, 0, ?)`,
    [id, listingId, key, kind.mime, data.length, position, nowIso()],
  );
  run("UPDATE listings SET updated_at = ? WHERE id = ?", [nowIso(), listingId]);

  return { id, url: `/api/media/${key}`, approved: false, position };
}

export function removePhoto(accountId: string, listingId: string, photoId: string) {
  ownListing(accountId, listingId);
  const photo = one<PhotoRow>("SELECT * FROM listing_photos WHERE id = ? AND listing_id = ?", [
    photoId,
    listingId,
  ]);
  if (!photo) throw notFound("Bild nicht gefunden.");
  removePublic(photo.storage_key);
  run("DELETE FROM listing_photos WHERE id = ?", [photoId]);
  run("UPDATE listings SET updated_at = ? WHERE id = ?", [nowIso(), listingId]);
}

/** Reihenfolge setzen: die übergebene Liste ist die neue Reihenfolge. */
export function reorderPhotos(accountId: string, listingId: string, order: string[]) {
  ownListing(accountId, listingId);
  const known = new Set(
    all<{ id: string }>("SELECT id FROM listing_photos WHERE listing_id = ?", [listingId]).map(
      (p) => p.id,
    ),
  );
  order.forEach((photoId, index) => {
    if (!known.has(photoId)) return;
    run("UPDATE listing_photos SET position = ? WHERE id = ?", [index, photoId]);
  });
}

/** Für die Auslieferung: Speicherschlüssel → Bildtyp. */
export function mimeOf(storageKey: string): string | null {
  const row = one<{ mime: string }>("SELECT mime FROM listing_photos WHERE storage_key = ?", [
    storageKey,
  ]);
  return row?.mime ?? null;
}
