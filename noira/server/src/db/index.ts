/* ============================================================
   Datenbank

   node:sqlite ist eingebaut — keine native Abhängigkeit, die beim
   Bauen bricht, und Tests laufen gegen :memory: statt gegen einen
   Dienst, den erst jemand starten muss.

   Für den Betrieb gehört hier PostgreSQL hin. Der Umbau ist
   absichtlich klein gehalten: Alle Abfragen laufen über die drei
   Funktionen unten, das SQL ist portabel geschrieben.
   ============================================================ */

import { DatabaseSync } from "node:sqlite";
import fs from "node:fs";
import path from "node:path";
import { env } from "../env.js";

const schemaPath = path.join(import.meta.dirname, "schema.sql");

export type Row = Record<string, unknown>;

let db: DatabaseSync;

export function openDatabase() {
  if (db) return db;

  if (env.databasePath !== ":memory:") {
    fs.mkdirSync(path.dirname(env.databasePath), { recursive: true });
  }
  db = new DatabaseSync(env.databasePath);

  // WAL hält Lesen und Schreiben auseinander; foreign_keys ist in
  // SQLite je Verbindung abzuschalten und standardmässig AUS —
  // ohne diese Zeile sind alle REFERENCES im Schema Dekoration.
  if (env.databasePath !== ":memory:") db.exec("PRAGMA journal_mode = WAL");
  db.exec("PRAGMA foreign_keys = ON");
  db.exec("PRAGMA busy_timeout = 5000");
  db.exec(fs.readFileSync(schemaPath, "utf8"));

  return db;
}

export function getDb() {
  return db ?? openDatabase();
}

/** Mehrere Zeilen. */
export function all<T = Row>(sql: string, params: unknown[] = []): T[] {
  return getDb().prepare(sql).all(...(params as never[])) as T[];
}

/** Genau eine Zeile oder undefined. */
export function one<T = Row>(sql: string, params: unknown[] = []): T | undefined {
  return getDb().prepare(sql).get(...(params as never[])) as T | undefined;
}

/** Schreibend; liefert die Zahl betroffener Zeilen. */
export function run(sql: string, params: unknown[] = []): number {
  const res = getDb().prepare(sql).run(...(params as never[]));
  return Number(res.changes);
}

/**
 * Transaktion. Wirft der Rumpf, wird zurückgerollt.
 * Kein Verschachteln — dafür gäbe es SAVEPOINT, das hier aber
 * niemand braucht und nur falsch verwendet würde.
 */
export function tx<T>(fn: () => T): T {
  const d = getDb();
  d.exec("BEGIN IMMEDIATE");
  try {
    const result = fn();
    d.exec("COMMIT");
    return result;
  } catch (err) {
    d.exec("ROLLBACK");
    throw err;
  }
}

export function closeDatabase() {
  if (db) {
    db.close();
    db = undefined as unknown as DatabaseSync;
  }
}
