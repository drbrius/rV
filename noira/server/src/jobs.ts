/* ============================================================
   Wiederkehrende Arbeiten

   Vier Versprechen, die ohne diese Datei nur auf der Website
   stünden:

   • Abgelaufene Inserate verschwinden aus der Suche.
   • Unbezahlte Bestellungen schliessen sich nach 24 Stunden.
   • Alte Sitzungen und Anmeldeversuche werden gelöscht.
   • Ausweisunterlagen werden nach Ablauf der Frist gelöscht.

   Hier als Intervall im selben Prozess — bei mehreren Instanzen
   gehört das in einen eigenen Dienst mit Sperre, damit die Arbeit
   nicht mehrfach läuft. Die Funktionen selbst sind so geschrieben,
   dass ein zweiter Durchlauf nichts kaputt macht.
   ============================================================ */

import type { FastifyBaseLogger } from "fastify";
import { pruneAuth } from "./domain/accounts.js";
import { expireListings } from "./domain/listings.js";
import { expireStaleOrders } from "./domain/payments.js";
import { purgeExpired } from "./domain/verification.js";

export function runMaintenance() {
  return {
    expiredListings: expireListings(),
    staleOrders: expireStaleOrders(),
    purgedDocuments: purgeExpired(),
    ...pruneAuth(),
  };
}

const EVERY = 15 * 60_000;

export function startScheduler(log: FastifyBaseLogger) {
  const tick = () => {
    try {
      const result = runMaintenance();
      const touched = Object.values(result).some((n) => n > 0);
      if (touched) log.info(result, "Wartung gelaufen");
    } catch (err) {
      // Ein Fehler in der Wartung darf den Server nicht mitreissen.
      log.error({ err }, "Wartung fehlgeschlagen");
    }
  };

  tick();
  const timer = setInterval(tick, EVERY);
  // Der Timer soll den Prozess nicht am Beenden hindern.
  timer.unref();
  return () => clearInterval(timer);
}
