/* Startpunkt: lauschen, Wartung anwerfen, sauber beenden. */

import { buildApp } from "./app.js";
import { closeDatabase } from "./db/index.js";
import { env } from "./env.js";
import { startScheduler } from "./jobs.js";

const app = await buildApp();
const stopScheduler = startScheduler(app.log);

try {
  await app.listen({ port: env.PORT, host: env.HOST });
  app.log.info(
    { provider: env.PAYMENT_PROVIDER, db: env.databasePath },
    `NOIRA hört auf http://${env.HOST}:${env.PORT}`,
  );
} catch (err) {
  app.log.error({ err }, "Start fehlgeschlagen");
  process.exit(1);
}

/* Laufende Anfragen zu Ende bringen, dann die Datenbank schliessen.
   Ohne das bleibt bei WAL eine halbe Transaktion liegen. */
for (const signal of ["SIGINT", "SIGTERM"] as const) {
  process.once(signal, async () => {
    app.log.info(`${signal} empfangen — fahre herunter.`);
    stopScheduler();
    await app.close();
    closeDatabase();
    process.exit(0);
  });
}
