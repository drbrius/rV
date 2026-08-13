/* ============================================================
   Die Anwendung

   `buildApp()` liefert einen fertig verdrahteten Server, ohne zu
   lauschen. Genau darum lässt er sich in Tests mit `app.inject()`
   ansprechen — ohne Port, ohne Wartezeit, ohne offene Verbindung,
   die am Ende hängen bleibt.
   ============================================================ */

import Fastify, { type FastifyInstance } from "fastify";
import cookie from "@fastify/cookie";
import multipart from "@fastify/multipart";
import rateLimit from "@fastify/rate-limit";
import { env } from "./env.js";
import { openDatabase } from "./db/index.js";
import { AppError, hashIp } from "./lib/http.js";
import { authPlugin } from "./plugins/auth.js";
import { publicRoutes } from "./routes/public.js";
import { authRoutes } from "./routes/auth.js";
import { meRoutes } from "./routes/me.js";
import { adminRoutes } from "./routes/admin.js";
import { paymentRoutes } from "./routes/payments.js";
import { mediaRoutes } from "./routes/media.js";

export async function buildApp(): Promise<FastifyInstance> {
  openDatabase();

  const app = Fastify({
    logger: env.isTest
      ? false
      : {
          level: env.isProd ? "info" : "debug",
          /* Keine IP-Adressen im Protokoll — auch nicht in der
             Zugriffszeile, die man leicht übersieht. */
          redact: ["req.headers.cookie", "req.headers.authorization", "req.remoteAddress"],
        },
    trustProxy: true,
    bodyLimit: 2 * 1024 * 1024,
  });

  /* Der rohe Rumpf bleibt erhalten. Der Zahlungs-Webhook prüft seine
     Signatur darüber; über dem neu serialisierten JSON zu prüfen
     schlüge fehl, sobald sich ein Leerzeichen unterscheidet. */
  app.addContentTypeParser("application/json", { parseAs: "string" }, (req, body, done) => {
    (req as { rawBody?: string }).rawBody = body as string;
    if (!body) return done(null, {});
    try {
      done(null, JSON.parse(body as string) as unknown);
    } catch {
      done(new AppError(400, "bad_request", "Kein gültiges JSON."), undefined);
    }
  });

  await app.register(cookie, { secret: undefined });
  await app.register(multipart, {
    limits: { fileSize: 12 * 1024 * 1024, files: 3, fields: 10 },
  });
  await app.register(rateLimit, {
    global: true,
    max: 300,
    timeWindow: "1 minute",
    /* Nach gehashter Herkunft zählen: Die Sperre soll wirken, ohne
       dass die Zähltabelle zur IP-Sammlung wird. */
    keyGenerator: (req) => hashIp(req.ip),
    enableDraftSpec: true,
  });

  app.addHook("onSend", async (_req, reply, payload) => {
    reply.headers({
      "x-content-type-options": "nosniff",
      "referrer-policy": "no-referrer",
      "x-frame-options": "DENY",
      "cross-origin-resource-policy": "same-site",
      "permissions-policy": "geolocation=(), microphone=(), camera=(), interest-cohort=()",
    });
    if (env.isProd) {
      reply.header("strict-transport-security", "max-age=31536000; includeSubDomains");
    }
    return payload;
  });

  await app.register(authPlugin);

  /* Fehlerbehandlung steht vor den Routen, nicht dahinter: Ein
     `setErrorHandler` nach `register` erreicht die bereits
     erzeugten Unterkontexte nicht mehr — die Routen antworten dann
     im Standardformat, und niemand merkt es, solange nur der
     Statuscode geprüft wird. */
  /**
   * Fehlerantworten nach RFC 9457 (problem+json).
   *
   * Ein Format für alle Fehler, maschinell auswertbar, mit einem
   * Feld für Formularfehler. Und nach aussen niemals ein Stacktrace:
   * Was schiefging, steht im Protokoll, nicht in der Antwort.
   */
  app.setErrorHandler((raw: unknown, req, reply) => {
    const error = raw as Error & { statusCode?: number; code?: string };
    if (error instanceof AppError) {
      return reply.code(error.status).type("application/problem+json").send({
        type: `https://noira.ch/fehler/${error.code}`,
        title: error.message,
        status: error.status,
        code: error.code,
        errors: error.details ?? undefined,
      });
    }

    const status = error.statusCode ?? 500;
    if (status >= 500) req.log.error({ err: error }, "Unerwarteter Fehler");

    return reply
      .code(status)
      .type("application/problem+json")
      .send({
        type: "https://noira.ch/fehler/allgemein",
        title:
          status >= 500
            ? "Da ist auf unserer Seite etwas schiefgelaufen."
            : (error.message ?? "Anfrage abgelehnt."),
        status,
        code: status >= 500 ? "internal_error" : (error.code ?? "bad_request"),
      });
  });

  app.setNotFoundHandler((req, reply) => {
    reply.code(404).type("application/problem+json").send({
      type: "https://noira.ch/fehler/not_found",
      title: "Diesen Endpunkt gibt es nicht.",
      status: 404,
      code: "not_found",
      detail: `${req.method} ${req.url}`,
    });
  });


  await app.register(publicRoutes);
  await app.register(authRoutes);
  await app.register(meRoutes);
  await app.register(adminRoutes);
  await app.register(paymentRoutes);
  await app.register(mediaRoutes);

  return app;
}
