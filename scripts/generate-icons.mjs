/**
 * Regenerates every raster icon from the two brand sources:
 *
 *   assets/brand/icon.png   the SK tile — white letters, full-bleed flame
 *                           orange — used for the favicon, the Apple touch
 *                           icon and the PWA icons
 *   assets/brand/mark.png   the wordmark on transparency, for the Open
 *                           Graph cards
 *
 * Run after changing either source:  npm run icons
 */
import fs from "node:fs";
import sharp from "sharp";

const SOURCE = "assets/brand/icon.png";
const MARK = "assets/brand/mark.png";
const CUTOUT = "public/santhosh-cutout.webp";

/* Lanczos down to each size from the full-resolution tile, so the letter
   edges stay crisp rather than picking up the blur of a chained resize. */
const icon = (size) =>
  sharp(SOURCE)
    .resize(size, size, { kernel: "lanczos3" })
    .png({ compressionLevel: 9 })
    .toBuffer();

/** ICO container holding PNG-encoded entries (read by every current browser). */
function ico(entries) {
  const header = Buffer.alloc(6);
  header.writeUInt16LE(1, 2); // type: icon
  header.writeUInt16LE(entries.length, 4);

  let offset = header.length + entries.length * 16;
  const directory = entries.map(({ size, data }) => {
    const entry = Buffer.alloc(16);
    entry.writeUInt8(size, 0); // width
    entry.writeUInt8(size, 1); // height
    entry.writeUInt16LE(1, 4); // colour planes
    entry.writeUInt16LE(32, 6); // bits per pixel
    entry.writeUInt32LE(data.length, 8);
    entry.writeUInt32LE(offset, 12);
    offset += data.length;
    return entry;
  });

  return Buffer.concat([header, ...directory, ...entries.map((e) => e.data)]);
}

const entries = [];
for (const size of [16, 32, 48]) entries.push({ size, data: await icon(size) });

const written = {
  "src/app/favicon.ico": ico(entries),
  "src/app/icon.png": await icon(512),
  "src/app/apple-icon.png": await icon(180),
  "public/icon-192.png": await icon(192),
  "public/icon-512.png": await icon(512),
  /* Trimmed to the ink so the card can position it by its real edges. */
  "src/app/_og/mark.png": await sharp(MARK)
    .trim({ threshold: 8 })
    .resize({ height: 160, kernel: "lanczos3" })
    .png({ compressionLevel: 9 })
    .toBuffer(),

  /* Head-and-torso crop of the cut-out for the home card. Satori cannot
     decode webp or honour object-fit, so the crop is baked in here and
     the card drops it into a slot of exactly this size. */
  "src/app/_og/portrait.png": await sharp(CUTOUT)
    .extract({ left: 23, top: 35, width: 1157, height: 1166 })
    .resize(482, 486, { kernel: "lanczos3" })
    .png({ compressionLevel: 9 })
    .toBuffer(),
};

for (const [file, data] of Object.entries(written)) {
  fs.writeFileSync(file, data);
  console.log(`${file} — ${data.length} bytes`);
}
