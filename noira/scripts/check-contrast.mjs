/* ============================================================
   Kontrastprüfung (WCAG 2.1)

   Geht jede Seite durch, nimmt sich jeden sichtbaren Textknoten und
   rechnet die tatsächliche Vordergrundfarbe über den tatsächlich
   dahinterliegenden Grund — Ebene für Ebene nach oben, bis eine
   deckende Fläche erreicht ist, inklusive Alpha und geerbter opacity.

   Warum von Hand und nicht per Bibliothek: Der Grund ist hier sehr
   dunkel und viele Flächen sind halbtransparent. Werkzeuge, die nur
   die deklarierte Farbe gegen die deklarierte Hintergrundfarbe
   stellen, übersehen genau die Fälle, die in der Praxis unlesbar sind.

   Aufruf:
     pnpm build && pnpm preview &
     node scripts/check-contrast.mjs            # AA: 4.5 / 3
     LIMIT=6 node scripts/check-contrast.mjs    # strenger, nur Bericht

   Exit-Code 1, sobald eine Stelle unter dem Schwellwert liegt.
   ============================================================ */

const BASE = process.env.BASE ?? "http://localhost:4173";
const LIMIT = process.env.LIMIT ? Number(process.env.LIMIT) : null;

const PAGES = [
  "/", "/inserate", "/inserate?kanton=ZH&verifiziert=1", "/inserat/elodie-zuerich",
  "/clubs", "/werben", "/inserat-erfassen", "/kasse?paket=premium&laufzeit=90",
  "/login", "/sicherheit", "/agb", "/datenschutz", "/impressum", "/merkliste", "/404",
];

let chromium;
try {
  ({ chromium } = await import("playwright"));
} catch {
  console.error(
    "playwright fehlt. Einmalig: pnpm dlx playwright install chromium\n" +
      "und `pnpm add -D playwright`, dann erneut aufrufen.",
  );
  process.exit(2);
}

/** Läuft im Browser. */
const audit = () => {
  /* Farben vom Browser auflösen lassen statt selbst zu parsen: Chrome
     liefert für oklch-Tokens auch als computed value wieder oklch()
     zurück. Zweimal auf Canvas malen — über Schwarz und über Weiss —
     und aus der Differenz Alpha und Grundfarbe zurückrechnen. Das
     versteht jedes CSS-Farbformat, heute und künftig. */
  const cv = document.createElement("canvas");
  cv.width = cv.height = 1;
  const cx = cv.getContext("2d", { willReadFrequently: true });
  const paint = (color, under) => {
    cx.globalCompositeOperation = "copy";
    cx.fillStyle = under;
    cx.fillRect(0, 0, 1, 1);
    cx.globalCompositeOperation = "source-over";
    cx.fillStyle = "#000";
    cx.fillStyle = color;
    if (cx.fillStyle === "#000" && !/^(#000|black|rgb\(0, 0, 0\))/i.test(color)) return null;
    cx.fillRect(0, 0, 1, 1);
    return cx.getImageData(0, 0, 1, 1).data;
  };
  const parse = (c) => {
    if (!c || c === "transparent" || c === "none") return { r: 0, g: 0, b: 0, a: 0 };
    const onBlack = paint(c, "#000");
    const onWhite = paint(c, "#fff");
    if (!onBlack || !onWhite) return null;
    const a = 1 - (onWhite[0] - onBlack[0]) / 255;
    if (a <= 0.001) return { r: 0, g: 0, b: 0, a: 0 };
    return { r: onBlack[0] / a, g: onBlack[1] / a, b: onBlack[2] / a, a };
  };
  const over = (fg, bg) => ({
    r: fg.r * fg.a + bg.r * (1 - fg.a),
    g: fg.g * fg.a + bg.g * (1 - fg.a),
    b: fg.b * fg.a + bg.b * (1 - fg.a),
    a: 1,
  });
  const lum = ({ r, g, b }) => {
    const f = (v) => {
      v /= 255;
      return v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4;
    };
    return 0.2126 * f(r) + 0.7152 * f(g) + 0.0722 * f(b);
  };
  const ratio = (a, b) => {
    const [x, y] = [lum(a), lum(b)].sort((m, n) => n - m);
    return (x + 0.05) / (y + 0.05);
  };

  const bodyBg = parse(getComputedStyle(document.body).backgroundColor) ?? {
    r: 11, g: 10, b: 14, a: 1,
  };
  const results = [];

  for (const el of document.querySelectorAll("*")) {
    const text = [...el.childNodes]
      .filter((n) => n.nodeType === 3 && n.textContent.trim())
      .map((n) => n.textContent.trim())
      .join(" ");
    if (!text) continue;

    const cs = getComputedStyle(el);
    if (cs.visibility === "hidden" || cs.display === "none") continue;
    const box = el.getBoundingClientRect();
    if (box.width < 1 || box.height < 1) continue;
    if (el.closest("[aria-hidden='true']")) continue;
    // Verlaufstext (background-clip) hat color: transparent — die sichtbare
    // Farbe steht im Verlauf und wird separat geprüft.
    if ((el.className?.toString?.() ?? "").includes("text-gilded")) continue;

    let opacity = 1;
    const layers = [];
    for (let n = el; n && n !== document.documentElement; n = n.parentElement) {
      const s = getComputedStyle(n);
      opacity *= parseFloat(s.opacity);
      const c = parse(s.backgroundColor);
      if (c && c.a > 0) {
        layers.push(c);
        if (c.a === 1) break;
      }
    }
    const bg = layers.reduceRight((acc, c) => over(c, acc), bodyBg);

    const fg0 = parse(cs.color);
    if (!fg0 || fg0.a === 0) continue;
    const fg = over({ ...fg0, a: fg0.a * opacity }, bg);

    const size = parseFloat(cs.fontSize);
    const weight = Number(cs.fontWeight) || 400;
    const large = size >= 24 || (size >= 18.66 && weight >= 700);

    results.push({
      text: text.slice(0, 52),
      cls: (el.className?.baseVal ?? el.className ?? "").toString().slice(0, 88),
      size: Math.round(size * 10) / 10,
      weight,
      ratio: Math.round(ratio(fg, bg) * 100) / 100,
      need: large ? 3 : 4.5,
    });
  }
  return results;
};

/* CHROMIUM_PATH erlaubt einen bereits vorhandenen Browser — praktisch in
   CI-Bildern, die Chromium mitbringen, statt ihn erneut zu laden. */
const browser = await chromium.launch(
  process.env.CHROMIUM_PATH ? { executablePath: process.env.CHROMIUM_PATH } : {},
);
const page = await (await browser.newContext({ viewport: { width: 1440, height: 1000 } })).newPage();
const all = new Map();

const collect = async (label) => {
  for (const f of await page.evaluate(audit)) {
    const key = `${f.cls}|${f.size}|${f.ratio}`;
    if (!all.has(key)) all.set(key, { ...f, page: label });
  }
};

// Die Altersschranke sieht jede Person als Erstes — also zuerst prüfen.
await page.goto(`${BASE}/`, { waitUntil: "networkidle" });
await page.waitForTimeout(600);
await collect("Altersschranke");
await page.locator("[role=dialog] button").first().click();

for (const path of PAGES) {
  await page.goto(BASE + path, { waitUntil: "networkidle" });
  await page.waitForTimeout(400);
  await collect(path);
}
await browser.close();

const found = [...all.values()].sort((a, b) => a.ratio - b.ratio);
const failing = found.filter((f) => (LIMIT ? f.ratio < LIMIT : f.ratio < f.need));

console.log(
  `\n${found.length} Textstellen geprüft — ${failing.length} unter ` +
    (LIMIT ? `${LIMIT}:1` : "dem WCAG-AA-Schwellwert"),
);
for (const f of failing) {
  console.log(
    `\n  ${f.ratio}:1 (nötig ${f.need}) · ${f.size}px/${f.weight} · ${f.page}` +
      `\n  "${f.text}"\n  ${f.cls}`,
  );
}

if (!LIMIT && failing.length) process.exit(1);
