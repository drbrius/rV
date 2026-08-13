/* ============================================================
   Sitzung und Rechte

   Die Sitzung steckt in einem httpOnly-Cookie: kein Zugriff aus
   JavaScript, also auch keiner über eine eingeschleuste Zeile
   Skript. In der Datenbank liegt nur der Hash des Tokens.

   `SameSite=Lax` genügt, weil alle schreibenden Aufrufe POST sind
   und Lax genau die nicht mitschickt. Der Zahlungs-Webhook läuft
   ohne Cookie über Signatur.
   ============================================================ */

import type { FastifyInstance, FastifyReply, FastifyRequest } from "fastify";
import fp from "fastify-plugin";
import { env } from "../env.js";
import { forbidden, unauthorized } from "../lib/http.js";
import { resolveSession, type Account } from "../domain/accounts.js";

export const SESSION_COOKIE = "noira_sid";

declare module "fastify" {
  interface FastifyRequest {
    account: Account | null;
  }
  interface FastifyInstance {
    requireAuth: (req: FastifyRequest, reply: FastifyReply) => Promise<void>;
    requireRole: (
      ...roles: Account["role"][]
    ) => (req: FastifyRequest, reply: FastifyReply) => Promise<void>;
  }
}

export const authPlugin = fp(async (app: FastifyInstance) => {
  app.decorateRequest("account", null);

  app.addHook("onRequest", async (req) => {
    const token = req.cookies[SESSION_COOKIE];
    req.account = token ? resolveSession(token) : null;
  });

  app.decorate("requireAuth", async (req: FastifyRequest) => {
    if (!req.account) throw unauthorized();
  });

  app.decorate(
    "requireRole",
    (...roles: Account["role"][]) =>
      async (req: FastifyRequest) => {
        if (!req.account) throw unauthorized();
        if (!roles.includes(req.account.role)) throw forbidden();
      },
  );
});

export function setSessionCookie(reply: FastifyReply, token: string, expiresAt: string) {
  reply.setCookie(SESSION_COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: env.isProd,
    path: "/",
    expires: new Date(expiresAt),
  });
}

export function clearSessionCookie(reply: FastifyReply) {
  reply.clearCookie(SESSION_COOKIE, { path: "/" });
}
