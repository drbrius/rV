/* Fehler und kleine Helfer für die Schnittstelle.

   Fehlerantworten folgen RFC 9457 (problem+json): ein Format, das
   Clients maschinell auswerten können, statt frei erfundener
   JSON-Formen je Endpunkt. */

import crypto from "node:crypto";
import { env } from "../env.js";

export class AppError extends Error {
  constructor(
    readonly status: number,
    readonly code: string,
    message: string,
    readonly details?: unknown,
  ) {
    super(message);
  }
}

export const badRequest = (msg: string, details?: unknown) =>
  new AppError(400, "bad_request", msg, details);
export const unauthorized = (msg = "Anmeldung erforderlich.") =>
  new AppError(401, "unauthorized", msg);
export const forbidden = (msg = "Dafür fehlen die Rechte.") => new AppError(403, "forbidden", msg);
export const notFound = (msg = "Nicht gefunden.") => new AppError(404, "not_found", msg);
export const conflict = (msg: string) => new AppError(409, "conflict", msg);
export const tooMany = (msg = "Zu viele Versuche. Bitte später erneut.") =>
  new AppError(429, "too_many_requests", msg);

/** IP niemals im Klartext protokollieren — gesalzen und gehasht genügt. */
export function hashIp(ip: string | undefined): string {
  return crypto
    .createHash("sha256")
    .update(env.ipHashSalt + (ip ?? "unbekannt"))
    .digest("hex")
    .slice(0, 32);
}

export const nowIso = () => new Date().toISOString();

export function plusDays(days: number, from = new Date()): string {
  const d = new Date(from);
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString();
}

export function plusMinutes(minutes: number, from = new Date()): string {
  return new Date(from.getTime() + minutes * 60_000).toISOString();
}

export const today = () => new Date().toISOString().slice(0, 10);
