/* ============================================================
   Nacharbeit für GitHub Pages

   Pages ist ein Dateiserver ohne Regeln — keine Rewrites, keine
   Kopfzeilen, keine Weiterleitungen. Drei Dinge fehlen dadurch,
   die Vercel von selbst mitbringt:

   1. Tiefe Links. Wer /inserate/elodie-zuerich direkt aufruft,
      bekommt von Pages eine 404 — die Datei gibt es ja nicht. Der
      übliche und einzige Weg: 404.html ist eine Kopie von
      index.html. Pages liefert sie mit Status 404 aus, die
      Anwendung startet trotzdem, liest den Pfad und zeigt die
      richtige Seite. Der Statuscode bleibt falsch; daran lässt
      sich auf Pages nichts ändern.

   2. Jekyll. Pages schickt jede Ablieferung durch Jekyll, das
      Dateien und Ordner mit führendem Unterstrich verschluckt.
      Eine leere .nojekyll schaltet das ab.

   3. Indexierung. Die robots.txt des Projekts gilt für noira.ch.
      Unter github.io steht eine Vorschau — die gehört nicht in
      den Suchindex, erst recht nicht bei diesem Gegenstand.
   ============================================================ */

import { copyFileSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";

const dist = path.resolve(import.meta.dirname, "..", "dist");
const base = process.env.VITE_BASE ?? "/";

copyFileSync(path.join(dist, "index.html"), path.join(dist, "404.html"));
writeFileSync(path.join(dist, ".nojekyll"), "");

writeFileSync(
  path.join(dist, "robots.txt"),
  [
    "# Vorschau-Auslieferung auf GitHub Pages.",
    "# Die Seite selbst ist unter noira.ch indexierbar, diese Kopie nicht.",
    "User-agent: *",
    "Disallow: /",
    "",
  ].join("\n"),
);

/* Wenn die Seite unter einem Unterpfad liegt, zeigt das Canonical
   weiterhin auf noira.ch — richtig so: Die Vorschau soll nicht mit
   dem Original um denselben Platz streiten. Geprüft wird hier nur,
   dass der Umbau der Pfade überhaupt gegriffen hat. */
const html = readFileSync(path.join(dist, "index.html"), "utf8");
if (base !== "/" && !html.includes(`${base}assets/`)) {
  throw new Error(
    `Die Pfade in index.html tragen das Basisstück "${base}" nicht. ` +
      `Wurde VITE_BASE auch beim Bauen gesetzt, nicht nur hier?`,
  );
}

console.log(`GitHub Pages vorbereitet (Basis "${base}"): 404.html, .nojekyll, robots.txt`);
