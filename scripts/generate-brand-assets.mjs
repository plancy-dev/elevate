/**
 * Favicon + app icons from a HIGH-RES square mark.
 *
 * Primary: public/brand/elevate-mark-master.png (transparent RGBA; 512+ px recommended).
 * Fallback: public/brand/elevate-mark-source.jpg if master PNG is missing.
 * Do NOT use tiny wordmark PNGs as the icon source — upscaling causes broken output.
 *
 * Optional: public/brand/elevate-wordmark-source.png — builds elevate-wordmark.png
 * only (marketing); never used for favicon.
 *
 * Favicon uses PNG embedded in .ico (Vista+), not BMP/DIB.
 *
 * Run: node scripts/generate-brand-assets.mjs
 */
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import sharp from "sharp";

const PNG_SIG = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);

/** Read IHDR width/height from a PNG buffer (no decode). */
function pngDimensions(png) {
  if (png.length < 24 || !png.subarray(0, 8).equals(PNG_SIG)) {
    throw new Error("Expected PNG buffer");
  }
  return {
    width: png.readUInt32BE(16),
    height: png.readUInt32BE(20),
  };
}

/**
 * Windows Vista+ ICO: embed complete PNG streams (no BMP/DIB).
 * Avoids `to-ico`-style DIB conversion that breaks alpha in some viewers/editors.
 */
function pngBuffersToIco(pngBuffers) {
  const n = pngBuffers.length;
  const header = Buffer.alloc(6);
  header.writeUInt16LE(0, 0);
  header.writeUInt16LE(1, 2);
  header.writeUInt16LE(n, 4);

  let offset = 6 + n * 16;
  const entries = [];

  for (const png of pngBuffers) {
    const { width, height } = pngDimensions(png);
    const entry = Buffer.alloc(16);
    const w = width >= 256 ? 0 : width;
    const h = height >= 256 ? 0 : height;
    entry.writeUInt8(w, 0);
    entry.writeUInt8(h, 1);
    entry.writeUInt8(0, 2);
    entry.writeUInt8(0, 3);
    entry.writeUInt16LE(1, 4);
    entry.writeUInt16LE(32, 6);
    entry.writeUInt32LE(png.length, 8);
    entry.writeUInt32LE(offset, 12);
    entries.push(entry);
    offset += png.length;
  }

  return Buffer.concat([header, ...entries, ...pngBuffers]);
}

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, "..");
const masterJpg = path.join(root, "public/brand/elevate-mark-source.jpg");
const masterPng = path.join(root, "public/brand/elevate-mark-master.png");
const wordmarkPath = path.join(root, "public/brand/elevate-wordmark-source.png");

/** Light backgrounds only — for small RGBA wordmarks, not for blue-on-white JPG marks. */
async function removeLightBackgroundPngBuffer(input) {
  const { data, info } = await sharp(input)
    .ensureAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });

  const out = Buffer.from(data);
  const { width, height } = info;

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const i = (y * width + x) * 4;
      const r = out[i];
      const g = out[i + 1];
      const b = out[i + 2];
      const max = Math.max(r, g, b);
      const min = Math.min(r, g, b);
      const sat = max === 0 ? 0 : (max - min) / max;
      const lum = (0.2126 * r + 0.7152 * g + 0.0722 * b) / 255;
      if (lum > 0.88 && sat < 0.2) {
        out[i + 3] = 0;
      }
    }
  }

  return sharp(out, {
    raw: { width, height, channels: 4 },
  }).png();
}

async function loadMasterMarkPng() {
  if (fs.existsSync(masterPng)) {
    const meta = await sharp(masterPng).metadata();
    if ((meta.width ?? 0) < 256 || (meta.height ?? 0) < 256) {
      console.warn(
        "elevate-mark-master.png is small; prefer 512+ px for crisp icons.",
      );
    }
    console.log("Using", masterPng);
    return sharp(masterPng).ensureAlpha().png().toBuffer();
  }
  if (fs.existsSync(masterJpg)) {
    console.log("Using", masterJpg);
    return sharp(masterJpg).resize(512, 512, { fit: "cover" }).png().toBuffer();
  }
  console.error(
    "Missing public/brand/elevate-mark-source.jpg or elevate-mark-master.png",
  );
  process.exit(1);
}

async function main() {
  const markPng = await loadMasterMarkPng();

  const png512 = await sharp(markPng).resize(512, 512).png().toBuffer();
  fs.writeFileSync(path.join(root, "public/brand/elevate-mark-512.png"), png512);

  const pngIco = (w) =>
    sharp(markPng)
      .resize(w, w, { kernel: sharp.kernel.lanczos3 })
      .ensureAlpha()
      .png({ compressionLevel: 9, force: true })
      .toBuffer();

  const [buf16, buf32, buf180, png192, iconApp] = await Promise.all([
    pngIco(16),
    pngIco(32),
    sharp(markPng).resize(180, 180, { kernel: sharp.kernel.lanczos3 }).png().toBuffer(),
    sharp(markPng).resize(192, 192, { kernel: sharp.kernel.lanczos3 }).png().toBuffer(),
    pngIco(32),
  ]);

  // PNG-in-ICO (not BMP): reliable transparency in browsers and most IDEs.
  const ico = pngBuffersToIco([buf32, buf16]);
  fs.writeFileSync(path.join(root, "public/favicon.ico"), ico);
  fs.writeFileSync(path.join(root, "public/apple-touch-icon.png"), buf180);
  fs.writeFileSync(path.join(root, "public/brand/elevate-mark-192.png"), png192);
  fs.writeFileSync(path.join(root, "src/app/icon.png"), iconApp);

  if (fs.existsSync(wordmarkPath)) {
    const wm = await removeLightBackgroundPngBuffer(
      await fs.promises.readFile(wordmarkPath),
    );
    await wm.png().toFile(path.join(root, "public/brand/elevate-wordmark.png"));
    console.log("Also wrote public/brand/elevate-wordmark.png");
  }

  console.log(
    "OK: favicon.ico, apple-touch-icon.png, elevate-mark-*.png, src/app/icon.png",
  );
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
