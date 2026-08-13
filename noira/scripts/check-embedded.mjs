/* ============================================================
   Prüfung: Hält die Seite ihren eigenen Grund?

   Anlass war ein Fehler, den keine Prüfung der Seite allein finden
   konnte. In einer fremden Hülle — Artifact-Vorschau, CMS, ein
   eingebetteter Ausschnitt — setzt der Gastgeber sein eigenes
   `body { background: #fff }`. Und weil **ungelayertes CSS jede
   Regel in einem @layer schlägt**, unabhängig von Spezifität und
   Reihenfolge, gewinnt diese eine Zeile gegen alles, was Tailwind
   in `@layer base` legt.

   Das Ergebnis: dunkle Textfarben auf weisser Fläche. Für sich
   gemessen war die Seite tadellos; erst in der Hülle brach sie.

   Diese Prüfung baut die Hülle nach: heller Gastgeber, ungelayert,
   und ein Browser im hellen Systemthema. Erwartet wird, dass die
   App ihren Grund trotzdem durchsetzt.

   Aufruf:  pnpm bundle && node scripts/check-embedded.mjs
   ============================================================ */

import fs from "node:fs";
import path from "node:path";
import os from "node:os";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const bundle = process.argv[2] ?? path.join(root, "dist", "noira-einzeldatei.html");
/** Erwarteter Grund — derselbe Wert wie --noira-ink in index.css. */
const EXPECTED = "oklch(0.242 0.021 293)";

if (!fs.existsSync(bundle)) {
  console.error(`Keine Einzeldatei unter ${bundle}. Zuerst: pnpm bundle`);
  process.exit(2);
}

let chromium;
try {
  ({ chromium } = await import("playwright"));
} catch {
  console.error("playwright fehlt. Einmalig: pnpm add -D playwright");
  process.exit(2);
}

const src = fs.readFileSync(bundle, "utf8");
const style = src.match(/<style>([\s\S]*?)<\/style>/)?.[1];
const script = src.match(/<script type="module">([\s\S]*?)<\/script>/)?.[1];
if (!style || !script) {
  console.error("Einzeldatei sieht anders aus als erwartet — Stil oder Skript nicht gefunden.");
  process.exit(2);
}

const host = `<!doctype html><html lang="de"><head><meta charset="utf-8">
<style>
  /* Feindliche Hülle: ungelayert und hell. */
  html { background: #ffffff; color: #111; }
  body { margin: 0; background: #ffffff; color: #111; font-family: system-ui, sans-serif; }
</style>
<style>${style}</style></head>
<body><div id="root"></div><script type="module">${script}</script></body></html>`;

const tmp = path.join(fs.mkdtempSync(path.join(os.tmpdir(), "noira-embed-")), "host.html");
fs.writeFileSync(tmp, host);

const browser = await chromium.launch(
  process.env.CHROMIUM_PATH ? { executablePath: process.env.CHROMIUM_PATH } : {},
);
const page = await (await browser.newContext({ colorScheme: "light" })).newPage();
await page.goto(`file://${tmp}`, { waitUntil: "load" });
await page.waitForTimeout(1200);

const seen = await page.evaluate(() => ({
  body: getComputedStyle(document.body).backgroundColor,
  html: getComputedStyle(document.documentElement).backgroundColor,
  app: document.querySelector("#root > div")
    ? getComputedStyle(document.querySelector("#root > div")).backgroundColor
    : null,
  gerendert: (document.getElementById("root")?.childElementCount ?? 0) > 0,
}));
await browser.close();
fs.rmSync(path.dirname(tmp), { recursive: true, force: true });

const ok = seen.gerendert && [seen.body, seen.html, seen.app].every((c) => c === EXPECTED);

console.log(
  `\nIn heller Hülle gerendert: ${seen.gerendert ? "ja" : "nein"}\n` +
    `  html  ${seen.html}\n  body  ${seen.body}\n  App   ${seen.app}\n` +
    `  erwartet ${EXPECTED}\n`,
);
console.log(ok ? "Die Seite setzt ihren Grund durch." : "FEHLER: Der Gastgeber scheint durch.");
process.exit(ok ? 0 : 1);
