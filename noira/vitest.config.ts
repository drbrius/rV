import { defineConfig } from "vitest/config";

/* `node:sqlite` ist zwar eingebaut, steht aber nicht in
   `module.builtinModules` — es existiert nur mit `node:`-Präfix.
   Vite kennt es darum nicht und versucht, „sqlite" aufzulösen. Der
   Zweizeiler unten sagt ihm, dass das ein Kern-Modul ist. */
const nodeSqlite = {
  name: "node-sqlite-extern",
  // `pre`, weil Vite das Präfix vorher abschneidet und dann nach
  // einem Paket namens „sqlite" sucht, das es nicht gibt.
  enforce: "pre" as const,
  resolveId(id: string) {
    return id === "node:sqlite" || id === "sqlite"
      ? { id: "node:sqlite", external: true }
      : null;
  },
};

export default defineConfig({
  plugins: [nodeSqlite],
  test: {
    include: ["server/test/**/*.test.ts"],
    setupFiles: ["server/test/setup.ts"],
    /* Jede Testdatei in eigenem Prozess: Die Datenbank ist ein
       Modul-Singleton im Arbeitsspeicher, und geteilter Zustand
       zwischen Dateien wäre eine Fehlerquelle statt einer
       Zeitersparnis. */
    isolate: true,
    pool: "forks",
    testTimeout: 20_000,
    server: { deps: { external: [/node:sqlite/, "node:sqlite"] } },
  },
});
