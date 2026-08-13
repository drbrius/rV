/* ============================================================
   Prüft die Pages-Auslieferung, bevor sie hochgeht.

   Ein Dateiserver, der sich genau wie GitHub Pages verhält:
   Alles unter /<repo>/, vorhandene Dateien werden ausgeliefert,
   alles Übrige bekommt 404.html mit Status 404. Dann wird die
   Seite in einem echten Browser aufgerufen.

   Drei Dinge sind hier zu widerlegen, und alle drei sind schon
   einmal jemandem passiert:

   • Die Pfade tragen das Basisstück nicht — die Seite bleibt weiss,
     weil Skript und Stilblatt 404 liefern.
   • Der Router kennt das Basisstück nicht — die Startseite geht,
     jeder tiefe Link zeigt „Seite nicht gefunden".
   • Der Wechsel innerhalb der Seite verliert das Basisstück — der
     erste Klick führt ins Leere.
   ============================================================ */

import { createServer } from "node:http";
import { existsSync, readFileSync, statSync } from "node:fs";
import path from "node:path";
import { chromium } from "playwright";

const dist = path.resolve(import.meta.dirname, "..", "dist");
const BASE = process.env.VITE_BASE ?? "/rv/";
const PORT = 5055;

const TYPES = {
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".svg": "image/svg+xml",
  ".woff2": "font/woff2",
  ".txt": "text/plain; charset=utf-8",
  ".png": "image/png",
};

const server = createServer((req, res) => {
  const url = new URL(req.url, `http://localhost:${PORT}`);

  if (!url.pathname.startsWith(BASE)) {
    res.writeHead(404).end("Ausserhalb des Projektpfads — so verhält sich Pages auch.");
    return;
  }

  const rel = url.pathname.slice(BASE.length) || "index.html";
  const file = path.join(dist, rel);

  if (existsSync(file) && statSync(file).isFile()) {
    res.writeHead(200, { "content-type": TYPES[path.extname(file)] ?? "application/octet-stream" });
    res.end(readFileSync(file));
    return;
  }

  // Genau wie Pages: unbekannter Pfad → 404.html, Status 404.
  res.writeHead(404, { "content-type": TYPES[".html"] });
  res.end(readFileSync(path.join(dist, "404.html")));
});

await new Promise((r) => server.listen(PORT, r));

const browser = await chromium.launch({ executablePath: process.env.CHROMIUM_PATH });
const page = await browser.newPage();
const problems = [];
const missing = [];

page.on("response", (r) => {
  if (r.status() === 404 && /\.(js|css|woff2|svg)$/.test(new URL(r.url()).pathname)) {
    missing.push(new URL(r.url()).pathname);
  }
});

const root = `http://localhost:${PORT}${BASE}`;

/* 1 — Startseite */
await page.goto(root, { waitUntil: "networkidle" });
const ground = await page.evaluate(() => getComputedStyle(document.body).backgroundColor);
const headings = await page.locator("h1, h2").count();
if (headings === 0) problems.push("Startseite: keine Überschrift gerendert.");
if (missing.length) problems.push(`Fehlende Dateien: ${[...new Set(missing)].join(", ")}`);

/* 2 — Tiefer Link über die 404-Umleitung */
const deep = `${root}inserat/elodie-zuerich`;
const res = await page.goto(deep, { waitUntil: "networkidle" });
const deepText = await page.locator("body").innerText();
if (/nicht gefunden|not found/i.test(deepText.slice(0, 400))) {
  problems.push(`Tiefer Link ${deep} landet auf der Fehlerseite.`);
}
if (!deepText.includes("Élodie")) {
  problems.push("Tiefer Link zeigt nicht das erwartete Inserat.");
}

/* 3 — Wechsel innerhalb der Seite behält das Basisstück */
await page.goto(root, { waitUntil: "networkidle" });
await page.locator(`a[href^="${BASE}"]`).first().click();
await page.waitForLoadState("networkidle");
const after = new URL(page.url()).pathname;
if (!after.startsWith(BASE)) {
  problems.push(`Nach dem Klick steht der Pfad auf ${after} — das Basisstück ist verloren.`);
}

await browser.close();
server.close();

console.log(`Pages-Probe unter ${BASE}`);
console.log(`  Grund der Seite ......... ${ground}`);
console.log(`  Überschriften gerendert . ${headings}`);
console.log(`  Tiefer Link ............. HTTP ${res.status()} (Pages liefert 404.html aus)`);
console.log(`  Pfad nach Klick ......... ${after}`);

if (problems.length) {
  console.error("\nNicht in Ordnung:");
  for (const p of problems) console.error(`  • ${p}`);
  process.exit(1);
}
console.log("\nDie Auslieferung unter einem Unterpfad trägt.");
