/* ============================================================
   Bilder ausliefern

   Bewusst über den Server statt über ein offenes Verzeichnis: So
   entscheidet die Datenbank, ob ein Bild sichtbar ist, und nicht
   das Dateisystem. Ein noch nicht geprüftes Bild liegt zwar
   gespeichert, wird aber nur der eigenen Person gezeigt.

   Im Betrieb steht davor ein CDN; der `ETag` unten ist der Grund,
   warum das ohne weitere Arbeit funktioniert.
   ============================================================ */

import crypto from "node:crypto";
import type { FastifyInstance } from "fastify";
import { one } from "../db/index.js";
import { notFound } from "../lib/http.js";
import { readPublic } from "../lib/storage.js";

export async function mediaRoutes(app: FastifyInstance) {
  app.get("/api/media/:key", async (req, reply) => {
    const { key } = req.params as { key: string };

    const photo = one<{ mime: string; approved: number; account_id: string }>(
      `SELECT p.mime, p.approved, l.account_id
         FROM listing_photos p JOIN listings l ON l.id = p.listing_id
        WHERE p.storage_key = ?`,
      [key],
    );
    if (!photo) throw notFound("Bild nicht gefunden.");

    const maySee =
      photo.approved === 1 ||
      req.account?.id === photo.account_id ||
      req.account?.role === "moderator" ||
      req.account?.role === "admin";
    if (!maySee) throw notFound("Bild nicht gefunden.");

    const data = readPublic(key);
    if (!data) throw notFound("Bild nicht gefunden.");

    const etag = `"${crypto.createHash("sha1").update(data).digest("base64url")}"`;
    if (req.headers["if-none-match"] === etag) {
      reply.code(304);
      return null;
    }

    reply
      .header("content-type", photo.mime)
      .header("etag", etag)
      /* Freigegebene Bilder darf jeder Zwischenspeicher behalten,
         ungeprüfte nicht: Sie gehören nur der eigenen Ansicht. */
      .header(
        "cache-control",
        photo.approved === 1 ? "public, max-age=31536000, immutable" : "private, no-store",
      );
    return data;
  });
}
