/* ============================================================
   Zahlungs-Webhook

   Der einzige Endpunkt ohne Sitzung und ohne Cookie. Er wird vom
   Anbieter aufgerufen, nicht von einem Browser, und deshalb gilt
   hier anderes:

   • Die Berechtigung kommt aus der Signatur über den *rohen* Rumpf.
     Über dem geparsten JSON zu signieren ginge schief, sobald die
     Serialisierung auch nur ein Leerzeichen anders setzt.
   • Auch was wir nicht zuordnen können, wird mit 200 quittiert und
     protokolliert. Ein Anbieter, der einen Fehler bekommt, wiederholt
     stundenlang; das verdeckt echte Störungen.
   ============================================================ */

import type { FastifyInstance } from "fastify";
import { z } from "zod";
import { env } from "../env.js";
import { AppError, badRequest } from "../lib/http.js";
import { handleEvent, providerFor } from "../domain/payments.js";
import { logAction } from "../domain/audit.js";

export async function paymentRoutes(app: FastifyInstance) {
  app.post(
    "/api/payments/webhook/:provider",
    { config: { rateLimit: { max: 600, timeWindow: "1 minute" } } },
    async (req, reply) => {
      const { provider } = req.params as { provider: string };
      const raw = (req as { rawBody?: string }).rawBody;
      if (typeof raw !== "string") throw badRequest("Roher Rumpf fehlt.");

      let event;
      try {
        event = providerFor(provider).parseEvent(raw, req.headers);
      } catch (err) {
        // Signaturfehler bleiben ein Fehler — sonst könnte jeder
        // Inserate freischalten.
        if (err instanceof AppError) throw err;
        throw badRequest("Ereignis nicht lesbar.");
      }

      const result = handleEvent(event, provider);
      if (!result.duplicate && !result.matched) {
        app.log.warn({ provider, event }, "Zahlungsereignis ohne passende Bestellung");
        logAction({
          actorKind: "system",
          action: "payment.unmatched",
          subjectType: "order",
          meta: { provider, providerRef: event.providerRef },
        });
      }
      reply.code(200);
      return { received: true, ...result };
    },
  );

  /* Nur ausserhalb des Betriebs: löst ein Ereignis von Hand aus,
     damit sich der Weg „bezahlt → freigeschaltet" ohne echten
     Anbieter durchspielen lässt. In Produktion existiert die Route
     nicht — kein Schalter, den jemand versehentlich umlegt. */
  if (!env.isProd) {
    app.post("/api/payments/simulieren", { onRequest: [app.requireAuth] }, async (req) => {
      const body = z
        .object({
          providerRef: z.string(),
          type: z
            .enum(["payment.succeeded", "payment.failed", "payment.expired"])
            .default("payment.succeeded"),
          eventId: z.string().optional(),
        })
        .safeParse(req.body ?? {});
      if (!body.success) throw badRequest("providerRef fehlt.");
      return handleEvent(
        {
          providerEventId: body.data.eventId ?? `sim_${Date.now()}`,
          type: body.data.type,
          providerRef: body.data.providerRef,
        },
        "mock",
      );
    });
  }
}
