import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import path from "node:path";
import { defineConfig } from "vite";

/* Auf eigener Domain liegt die Seite an der Wurzel. Auf GitHub Pages
   liegt sie unter /<repo>/ — dann müssen sämtliche Pfade (Skripte,
   Schriften, Favicon) dieses Stück vorangestellt bekommen. Vite macht
   das für alles, was es kennt; die Routen ziehen über
   `import.meta.env.BASE_URL` nach. */
const base = process.env.VITE_BASE ?? "/";

export default defineConfig({
  base,
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      "@": path.resolve(import.meta.dirname, "client", "src"),
    },
  },
  root: path.resolve(import.meta.dirname, "client"),
  build: {
    outDir: path.resolve(import.meta.dirname, "dist"),
    emptyOutDir: true,
  },
  server: {
    port: 3000,
    host: true,
  },
});
