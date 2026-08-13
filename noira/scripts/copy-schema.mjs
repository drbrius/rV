/* `tsc` kopiert nur TypeScript. Das Schema ist SQL und muss von Hand
   neben den Übersetzungsstand — sonst startet der gebaute Server und
   findet seine Tabellen nicht. */
import { copyFileSync, mkdirSync } from "node:fs";
import path from "node:path";

const from = path.resolve(import.meta.dirname, "../server/src/db/schema.sql");
const to = path.resolve(import.meta.dirname, "../dist-server/db/schema.sql");
mkdirSync(path.dirname(to), { recursive: true });
copyFileSync(from, to);
console.log(`schema.sql → ${path.relative(process.cwd(), to)}`);
