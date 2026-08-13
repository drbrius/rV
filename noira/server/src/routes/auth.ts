/* ============================================================
   Registrierung, Anmeldung, Abmeldung
   ============================================================ */

import type { FastifyInstance } from "fastify";
import { z } from "zod";
import { badRequest, hashIp, unauthorized } from "../lib/http.js";
import {
  authenticate,
  createAccount,
  endAllSessions,
  endSession,
  listSessions,
  publicAccount,
  startSession,
} from "../domain/accounts.js";
import { logAction } from "../domain/audit.js";
import { latestFor } from "../domain/verification.js";
import { SESSION_COOKIE, clearSessionCookie, setSessionCookie } from "../plugins/auth.js";

/* Mindestlänge statt Zeichenklassen-Zwang: Länge trägt mehr zur
   Sicherheit bei als ein erzwungenes Sonderzeichen, das am Ende
   immer ein Ausrufezeichen ist. */
const credentials = z.object({
  email: z.email("Bitte eine gültige E-Mail-Adresse."),
  password: z.string().min(10, "Mindestens 10 Zeichen.").max(200),
});

export async function authRoutes(app: FastifyInstance) {
  app.post(
    "/api/auth/registrieren",
    { config: { rateLimit: { max: 10, timeWindow: "1 hour" } } },
    async (req, reply) => {
      const parsed = credentials
        .extend({ acceptedTerms: z.literal(true, "Die Bedingungen müssen bestätigt werden.") })
        .safeParse(req.body);
      if (!parsed.success)
        throw badRequest("Registrierung unvollständig.", z.treeifyError(parsed.error));

      const account = createAccount(parsed.data.email, parsed.data.password);
      const session = startSession(account.id, req.headers["user-agent"], hashIp(req.ip));
      setSessionCookie(reply, session.token, session.expiresAt);
      logAction({
        actorId: account.id,
        actorKind: "advertiser",
        action: "account.created",
        subjectType: "account",
        subjectId: account.id,
        ipHash: hashIp(req.ip),
      });
      reply.code(201);
      return { account: publicAccount(account) };
    },
  );

  app.post(
    "/api/auth/anmelden",
    { config: { rateLimit: { max: 20, timeWindow: "15 minutes" } } },
    async (req, reply) => {
      const parsed = credentials.safeParse(req.body);
      // Bei der Anmeldung keine Feldfehler zurückgeben: Sonst verrät
      // die Antwort, ob die Adresse überhaupt existiert.
      if (!parsed.success) throw unauthorized("E-Mail-Adresse oder Passwort stimmt nicht.");

      const account = authenticate(parsed.data.email, parsed.data.password, hashIp(req.ip));
      const session = startSession(account.id, req.headers["user-agent"], hashIp(req.ip));
      setSessionCookie(reply, session.token, session.expiresAt);
      return { account: publicAccount(account) };
    },
  );

  app.post("/api/auth/abmelden", async (req, reply) => {
    const token = req.cookies[SESSION_COOKIE];
    if (token) endSession(token);
    clearSessionCookie(reply);
    return { ok: true };
  });

  /* Alle Geräte abmelden — gehört zu jedem Konto, das ein Passwort
     verloren haben könnte. */
  app.post("/api/auth/alle-abmelden", { onRequest: [app.requireAuth] }, async (req, reply) => {
    endAllSessions(req.account!.id);
    clearSessionCookie(reply);
    return { ok: true };
  });

  app.get("/api/auth/ich", async (req) => {
    if (!req.account) return { account: null, verification: null };
    return {
      account: publicAccount(req.account),
      verification: latestFor(req.account.id),
      sessions: listSessions(req.account.id).length,
    };
  });
}
