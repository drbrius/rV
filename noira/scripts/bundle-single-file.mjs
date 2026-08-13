/* ============================================================
   Einzeldatei-Build
   Baut die App und faltet danach JS, CSS, Schriften und Favicon
   in eine einzige HTML-Datei. Gedacht für Vorschauen, die ohne
   Server auskommen müssen — ein Anhang, eine geteilte Datei, ein
   Artifact. Die reguläre Auslieferung bleibt der normale Build.

   Aufruf:  node scripts/bundle-single-file.mjs [ziel.html]
   ============================================================ */

import { execFileSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const dist = path.join(root, "dist");
const out = path.resolve(process.argv[2] ?? path.join(dist, "noira-einzeldatei.html"));

console.log("Baue mit Hash-Routing …");
execFileSync(path.join(root, "node_modules/.bin/vite"), ["build"], {
  cwd: root,
  env: { ...process.env, VITE_HASH_ROUTING: "1" },
  stdio: "inherit",
});

const read = (p) => fs.readFileSync(path.join(dist, p));
const asDataUri = (buf, mime) => `data:${mime};base64,${buf.toString("base64")}`;

let html = read("index.html").toString();

/* --- Schriften in das Stylesheet einbetten ------------------------ */
const assets = fs.readdirSync(path.join(dist, "assets"));
const cssName = assets.find((f) => f.endsWith(".css"));
const jsName = assets.find((f) => f.endsWith(".js"));

let css = read(path.join("assets", cssName)).toString();
css = css.replace(/url\("?\/fonts\/([^)"]+)"?\)/g, (_m, file) => {
  const buf = fs.readFileSync(path.join(dist, "fonts", file));
  return `url("${asDataUri(buf, "font/woff2")}")`;
});

const js = read(path.join("assets", jsName)).toString();
const favicon = asDataUri(read("favicon.svg"), "image/svg+xml");

/* --- Verweise durch Inhalte ersetzen ------------------------------
   Immer über eine Ersetzungsfunktion: Als Zeichenkette übergeben würde
   String.replace die $-Sequenzen im minifizierten Code als Rückverweise
   deuten und das Bundle stillschweigend zerlegen.
   Ausserdem wird ein im Code enthaltenes </script> entschärft, das den
   Block sonst vorzeitig beendet. */
const inject = (value) => () => value;
const safeClose = (code, tag) =>
  code.replace(new RegExp(`</(${tag})`, "gi"), "<\\/$1");

html = html
  .replace(/\s*<link[^>]+rel="preload"[^>]*>/g, "") // Preloads sind ohne Dateien sinnlos
  .replace(/<link[^>]+rel="icon"[^>]*>/, inject(`<link rel="icon" href="${favicon}" />`))
  .replace(
    /<link[^>]+href="[^"]*\.css"[^>]*>/,
    inject(`<style>\n${safeClose(css, "style")}\n</style>`),
  )
  .replace(
    /<script[^>]*src="[^"]*\.js"[^>]*><\/script>/,
    inject(`<script type="module">\n${safeClose(js, "script")}\n</script>`),
  );

/* Der Seitentitel der Auslieferung ist für Suchmaschinen geschrieben
   („NOIRA — Das diskrete Erotikportal der Schweiz"). Eine Vorschau wird
   dagegen in einer Dateiliste oder einem Tab wiedererkannt, da genügt
   der Name. */
html = html.replace(/<title>([^<]*)<\/title>/, (_m, full) =>
  `<title>${full.split("—")[0].trim()}</title>`,
);

/* Kontrolle statt Vertrauen: Bleibt ein Verweis auf eine Datei stehen,
   ist die Seite ohne Server kaputt — und zwar leise. */
const leftovers = html.match(/(src|href)="\/[^"]+"/g);
if (leftovers) {
  throw new Error(`Nicht eingebettete Verweise: ${leftovers.join(", ")}`);
}

fs.mkdirSync(path.dirname(out), { recursive: true });
fs.writeFileSync(out, html);

const kb = (n) => `${Math.round(n / 1024)} kB`;
console.log(`\nEine Datei: ${out}`);
console.log(`  gesamt ${kb(Buffer.byteLength(html))} (JS ${kb(js.length)}, CSS inkl. Schriften ${kb(css.length)})`);
