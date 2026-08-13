/* ============================================================
   Gesamtdokumentation als eine Datei

   README.md und server/README.md sind zwei Dokumente, weil sie
   zwei Leserschaften haben: wer die Seite gestaltet, und wer den
   Server betreibt. Zum Weitergeben — an eine Agentur, eine
   Anwältin, einen Acquirer — braucht es beides in einem Stück,
   mit Inhaltsverzeichnis und ohne Verweise, die ins Leere führen.

   Erzeugt statt gepflegt: Eine dritte Datei, die von Hand
   nachgeführt werden müsste, wäre nach zwei Wochen falsch.
   ============================================================ */

import { readFileSync, writeFileSync } from "node:fs";
import path from "node:path";

const root = path.resolve(import.meta.dirname, "..");
const out = path.join(root, "NOIRA-Dokumentation.md");

const main = readFileSync(path.join(root, "README.md"), "utf8");
const server = readFileSync(path.join(root, "server", "README.md"), "utf8");

/* --- Hauptdokument zerlegen ---------------------------------- */

const introEnd = main.indexOf("## 1. Analyse");
const deployStart = main.indexOf("## 7. Auslieferung");

if (introEnd < 0 || deployStart < 0) {
  throw new Error("README.md ist anders gegliedert als erwartet — Export abgebrochen.");
}

const intro = main.slice(0, introEnd);
const design = main.slice(introEnd, deployStart);
const tail = main
  .slice(deployStart)
  // Der Serverteil schiebt sich dazwischen, also rücken diese zwei nach hinten.
  .replace("## 7. Auslieferung", "## 8. Auslieferung")
  .replace("## 8. Was noch fehlt", "## 9. Was noch fehlt");

/* --- Serverdokument einbetten -------------------------------- */

const serverBody = server
  .replace(/^# .*\n/, "") // eigene Überschrift weg, es gibt schon eine
  .replace(/^(#{2,5}) /gm, (_, hashes) => `${hashes}# `) // eine Ebene tiefer
  .trim();

/* --- Querverweise, die in einer Datei anders lauten ----------- */

const introFixed = intro.replace(
  /Einzelheiten zum Backend[\s\S]*?\[`server\/README\.md`\]\(server\/README\.md\)\./,
  "Der Serverteil steht vollständig in Abschnitt 7.",
);

const stand = new Date().toISOString().slice(0, 10);

const document = `# NOIRA — Gesamtdokumentation

> Erzeugt aus \`README.md\` und \`server/README.md\` mit \`pnpm export:doc\`.
> Stand: ${stand}. Nicht von Hand ändern — die Quellen sind die zwei READMEs.

${introFixed
  .replace(/^# .*\n\n/, "")
  .trim()
  // Der Einleitungsblock endet bereits mit einem Trennstrich.
  .replace(/\n*-{3,}$/, "")
  .trim()}

---

## Inhalt

1. [Analyse der Referenzen](#1-analyse-der-referenzen)
2. [Positionierung von NOIRA](#2-positionierung-von-noira)
3. [Marke: die Eklipse](#3-marke-die-eklipse)
4. [Mehrsprachigkeit](#4-mehrsprachigkeit)
5. [Seiten und Informationsarchitektur](#5-seiten-und-informationsarchitektur)
6. [Zahlung](#6-zahlung)
7. [Der Server](#7-der-server)
8. [Auslieferung](#8-auslieferung)
9. [Was noch fehlt](#9-was-noch-fehlt)

---

${design.trim()}

## 7. Der Server

${serverBody}

---

${tail.trim()}
`;

writeFileSync(out, document);

const words = document.split(/\s+/).length;
console.log(
  `${path.relative(process.cwd(), out)} — ${document.split("\n").length} Zeilen, ~${words} Wörter`,
);
