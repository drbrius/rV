/* ============================================================
   Platzhalter-Bilder für den Demo-Datensatz.

   Ein winziger PNG-Kodierer statt einer Bildbibliothek: Der
   Demo-Datensatz braucht echte Dateien, damit `/api/media` sich im
   Betrieb genau so verhält wie später mit hochgeladenen Fotos —
   gleiche Kopfzeilen, gleiches ETag, gleiche Zwischenspeicherung.
   Eine Abhängigkeit von 30 MB dafür wäre unverhältnismässig.

   Erzeugt wird kein Portrait, sondern ein Farbverlauf mit
   Kornstruktur. Das ist ehrlich: Diese Daten sind erfunden, und die
   Bilder sollen das nicht verbergen.
   ============================================================ */

import zlib from "node:zlib";

function crc32(buf: Buffer): number {
  let c = ~0;
  for (const byte of buf) {
    c ^= byte;
    for (let k = 0; k < 8; k++) c = (c >>> 1) ^ (0xedb88320 & -(c & 1));
  }
  return ~c >>> 0;
}

function chunk(type: string, data: Buffer): Buffer {
  const head = Buffer.alloc(4);
  head.writeUInt32BE(data.length);
  const body = Buffer.concat([Buffer.from(type, "ascii"), data]);
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(body));
  return Buffer.concat([head, body, crc]);
}

/* Sechs Farbstimmungen, passend zur Palette der Oberfläche:
   Tinte, Aubergine, Orchidee, Gold, Nachtblau, Rost. */
const MOTIFS: [number, number, number][] = [
  [32, 30, 41],
  [58, 40, 66],
  [86, 46, 92],
  [120, 92, 48],
  [30, 44, 74],
  [92, 52, 40],
];

export function placeholderPhoto(motif: number, seed: number, width = 720, height = 960): Buffer {
  const [r0, g0, b0] = MOTIFS[motif % MOTIFS.length];
  const stride = width * 3;
  const raw = Buffer.alloc((stride + 1) * height);

  /* Der Startwert verschiebt Lichtpunkt und Streifenlage. Kein
     Zufallsgenerator: derselbe Startwert muss dasselbe Bild geben,
     damit ein zweiter Seed-Lauf keine neuen Dateien erzeugt. */
  const cx = 0.35 + ((seed * 37) % 30) / 100;
  const cy = 0.3 + ((seed * 53) % 28) / 100;
  const phase = seed % 16;

  const row = Buffer.alloc(stride);
  const prev = Buffer.alloc(stride);

  for (let y = 0; y < height; y++) {
    const t = y / height;
    for (let x = 0; x < width; x++) {
      const u = x / width;
      // Verlauf mit einem Lichtpunkt, der je Bild anders liegt.
      const glow = 1 - Math.min(1, Math.hypot(u - cx, t - cy) * 1.7);
      const lift = 0.35 + glow * 0.9 - t * 0.25;
      /* Ein Streifen alle 16 Zeilen statt Rauschen je Pixel: Das
         Bild bekommt Struktur, ohne dass jede Zeile anders aussieht
         als die darüber. Rauschen je Pixel kostete das Zwanzigfache
         an Dateigrösse — Deflate fände darin keine Wiederholung. */
      const band = (y + phase) % 16 === 0 ? 6 : 0;
      const i = x * 3;
      // Auf Vielfache von 4 gequantelt: nimmt dem Verlauf das
      // Rundungsflimmern, das sonst jede Zeile leicht verschiebt.
      row[i] = quant(r0 * lift + band + glow * 60);
      row[i + 1] = quant(g0 * lift + band + glow * 44);
      row[i + 2] = quant(b0 * lift + band + glow * 52);
    }

    /* Filtertyp 2 („Up"): jede Zeile als Differenz zur Zeile darüber.
       Bei einem senkrechten Verlauf sind diese Differenzen fast
       durchweg null — genau das, wofür der Filter gedacht ist. */
    const base = y * (stride + 1);
    raw[base] = 2;
    for (let i = 0; i < stride; i++) raw[base + 1 + i] = (row[i]! - prev[i]!) & 0xff;
    row.copy(prev);
  }

  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(width, 0);
  ihdr.writeUInt32BE(height, 4);
  ihdr[8] = 8; // 8 Bit je Kanal
  ihdr[9] = 2; // Echtfarben, ohne Alpha
  ihdr[10] = 0;
  ihdr[11] = 0;
  ihdr[12] = 0;

  return Buffer.concat([
    Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    chunk("IHDR", ihdr),
    chunk("IDAT", zlib.deflateSync(raw, { level: 9 })),
    chunk("IEND", Buffer.alloc(0)),
  ]);
}

const clamp = (v: number) => Math.max(0, Math.min(255, Math.round(v)));
const quant = (v: number) => clamp(Math.round(v / 4) * 4);
