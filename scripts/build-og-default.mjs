/**
 * Build default Open Graph image (1200×630) from a high-res source PNG.
 *
 * 1. Resize source to 1200×630 (cover, centre).
 * 2. Edge strip (**default `edge`**): color = **Euclidean closest point** on the
 *    inner content rect [t,w−t)×[t,h−t) to (x,y), then sample that pixel (axis clamp).
 *    This removes corner “stitch” artifacts from **averaging** top+left+right samples.
 *    Optional **--smooth N**: N×N box blur of the sample (default 1 → 3×3) to match
 *    film grain without single-pixel sparkle at the seam.
 * 3. **grain** defaults to **0** in `edge` mode (adds synthetic noise that fights the
 *    source texture). Use `--grain 1` only if needed.
 *
 * Usage:
 *   node scripts/build-og-default.mjs
 *   node scripts/build-og-default.mjs --smooth 0        # single-pixel sample only
 *   node scripts/build-og-default.mjs --base white
 *   node scripts/build-og-default.mjs --border 52 --webp
 *   node scripts/build-og-default.mjs --grain 2
 *   node scripts/build-og-default.mjs --no-grain
 */
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import sharp from "sharp";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, "..");
const DEFAULT_INPUT = path.join(
  ROOT,
  "public",
  "brand",
  "og-source.png",
);
const OUT_PNG = path.join(ROOT, "public", "og-default.png");
const OUT_WEBP = path.join(ROOT, "public", "og-default.webp");

const TARGET_W = 1200;
const TARGET_H = 630;

const DEFAULT_BORDER_PX = 52;
/** Synthetic grain on strips; 0 avoids mismatch with source film grain (`edge` default). */
const DEFAULT_GRAIN = 0;
/** Box radius for averaging source color at sample point (1 → 3×3). Reduces seam sparkle. */
const DEFAULT_SMOOTH_RADIUS = 1;

/**
 * Regions in 1200×630 space — **inside** the inner card, away from far outer white.
 * Tuned for centered “Elevate” + subtitle layout; adjust if art changes.
 */
const SAMPLE_PANEL_REGIONS = [
  { left: 500, top: 128, width: 200, height: 72 }, // above title
  { left: 460, top: 472, width: 280, height: 76 }, // below subtitle
  { left: 196, top: 268, width: 96, height: 96 }, // panel left of type
  { left: 908, top: 268, width: 96, height: 96 }, // panel right of type
];

/** Extra samples on the **right** (weighted) — matches visible seam on R / bottom-R. */
const SAMPLE_RIGHT_WEIGHTED = [
  { left: 860, top: 188, width: 140, height: 200 },
  { left: 820, top: 380, width: 160, height: 100 },
];
const RIGHT_SAMPLE_WEIGHT = 2;

function parseArgs() {
  const args = process.argv.slice(2);
  let input = DEFAULT_INPUT;
  let webp = false;
  let borderPx = DEFAULT_BORDER_PX;
  let grain = DEFAULT_GRAIN;
  let smoothRadius = DEFAULT_SMOOTH_RADIUS;
  /** `edge` = per-pixel match to inner border (gradients); `white` | `sample`. */
  let base = "edge";
  for (let i = 0; i < args.length; i++) {
    if (args[i] === "--input" && args[i + 1]) {
      input = path.resolve(args[++i]);
    } else if (args[i] === "--webp") {
      webp = true;
    } else if (args[i] === "--no-grain") {
      grain = 0;
    } else if (args[i] === "--base" && args[i + 1]) {
      const v = args[++i];
      if (v === "edge" || v === "white" || v === "sample") {
        base = v;
      }
    } else if (args[i] === "--border" && args[i + 1]) {
      const n = Number.parseInt(args[++i], 10);
      if (Number.isFinite(n) && n >= 0 && n < 250) {
        borderPx = n;
      }
    } else if (args[i] === "--grain" && args[i + 1]) {
      const n = Number.parseInt(args[++i], 10);
      if (Number.isFinite(n) && n >= 0 && n <= 32) {
        grain = n;
      }
    } else if (args[i] === "--smooth" && args[i + 1]) {
      const n = Number.parseInt(args[++i], 10);
      if (Number.isFinite(n) && n >= 0 && n <= 4) {
        smoothRadius = n;
      }
    }
  }
  return { input, webp, borderPx, grain, base, smoothRadius };
}

function averageRgb(raw, channels) {
  const step = channels;
  let r = 0;
  let g = 0;
  let b = 0;
  let n = 0;
  for (let i = 0; i < raw.length; i += step) {
    r += raw[i];
    g += raw[i + 1];
    b += raw[i + 2];
    n += 1;
  }
  if (n === 0) return { r: 245, g: 245, b: 245 };
  return {
    r: Math.round(r / n),
    g: Math.round(g / n),
    b: Math.round(b / n),
  };
}

async function samplePaperFromPanel(fullPng) {
  let sumR = 0;
  let sumG = 0;
  let sumB = 0;
  let wsum = 0;

  async function addRegion(reg, weight) {
    const { data, info } = await sharp(fullPng)
      .extract(reg)
      .raw()
      .toBuffer({ resolveWithObject: true });
    const c = averageRgb(data, info.channels);
    sumR += c.r * weight;
    sumG += c.g * weight;
    sumB += c.b * weight;
    wsum += weight;
  }

  for (const reg of SAMPLE_PANEL_REGIONS) {
    await addRegion(reg, 1);
  }
  for (const reg of SAMPLE_RIGHT_WEIGHTED) {
    await addRegion(reg, RIGHT_SAMPLE_WEIGHT);
  }

  return {
    r: Math.round(sumR / wsum),
    g: Math.round(sumG / wsum),
    b: Math.round(sumB / wsum),
  };
}

function clampByte(v) {
  return Math.max(0, Math.min(255, v));
}

function hash01(ix, iy) {
  let n = Math.imul(ix, 374761393) + Math.imul(iy, 668265263);
  n = (n ^ (n >>> 13)) >>> 0;
  n = Math.imul(n, 1274126177) >>> 0;
  return n / 4294967296;
}

function smoothstep01(t) {
  const x = Math.min(1, Math.max(0, t));
  return x * x * (3 - 2 * x);
}

/**
 * Bilinear value noise on a coarse grid — **no** sin/cos standing waves (those
 * caused the checker / moiré on top/left/bottom strips). Deterministic per (x,y).
 */
function valueNoiseBilinear(x, y, cellInv) {
  const x0 = Math.floor(x * cellInv);
  const y0 = Math.floor(y * cellInv);
  const fx = smoothstep01((x * cellInv) - x0);
  const fy = smoothstep01((y * cellInv) - y0);
  const n00 = hash01(x0, y0);
  const n10 = hash01(x0 + 1, y0);
  const n01 = hash01(x0, y0 + 1);
  const n11 = hash01(x0 + 1, y0 + 1);
  const nx0 = n00 + fx * (n10 - n00);
  const nx1 = n01 + fx * (n11 - n01);
  return nx0 + fy * (nx1 - nx0);
}

/** Paper-like grain: one coarse + one finer octave, both smooth (no grid artifact). */
function stripGrain(x, y, grain) {
  if (grain <= 0) return 0;
  const v1 = valueNoiseBilinear(x, y, 0.17) - 0.5;
  const v2 = valueNoiseBilinear(x + 31.7, y + 24.3, 0.42) - 0.5;
  const m = v1 * 0.78 + v2 * 0.22;
  return Math.round(m * 2 * grain * 0.78);
}

/**
 * RGBA buffer: edge strips opaque, rest transparent. Flat RGB + grain.
 */
function buildEdgeOverlayRgba(t, w, h, r, g, b, grain) {
  const channels = 4;
  const buf = Buffer.alloc(w * h * channels, 0);

  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const edge =
        x < t || x >= w - t || y < t || y >= h - t;
      if (!edge) continue;
      const i = (y * w + x) * channels;
      const j = stripGrain(x, y, grain);
      buf[i] = clampByte(r + j);
      buf[i + 1] = clampByte(g + j);
      buf[i + 2] = clampByte(b + j);
      buf[i + 3] = 255;
    }
  }
  return buf;
}

/**
 * Closest point (Euclidean) on the **filled** inner rectangle to strip pixel (x,y).
 * Equivalent to axis clamp when the rect is axis-aligned — one coherent sample, no
 * corner averaging seam.
 */
function closestPointOnInnerRect(x, y, t, w, h) {
  const xmin = t;
  const xmax = w - t - 1;
  const ymin = t;
  const ymax = h - t - 1;
  return {
    x: Math.min(Math.max(x, xmin), xmax),
    y: Math.min(Math.max(y, ymin), ymax),
  };
}

function buildEdgeOverlayRgbaFromSource(
  data,
  w,
  h,
  channels,
  t,
  grain,
  smoothRadius,
) {
  const outChannels = 4;
  const buf = Buffer.alloc(w * h * outChannels, 0);

  const getRgb = (x, y) => {
    const xi = Math.min(w - 1, Math.max(0, x | 0));
    const yi = Math.min(h - 1, Math.max(0, y | 0));
    const o = (yi * w + xi) * channels;
    return { r: data[o], g: data[o + 1], b: data[o + 2] };
  };

  const getRgbSmooth = (cx, cy, sr) => {
    if (sr <= 0) {
      return getRgb(cx, cy);
    }
    let sumR = 0;
    let sumG = 0;
    let sumB = 0;
    let n = 0;
    for (let dy = -sr; dy <= sr; dy++) {
      for (let dx = -sr; dx <= sr; dx++) {
        const c = getRgb(cx + dx, cy + dy);
        sumR += c.r;
        sumG += c.g;
        sumB += c.b;
        n += 1;
      }
    }
    return {
      r: Math.round(sumR / n),
      g: Math.round(sumG / n),
      b: Math.round(sumB / n),
    };
  };

  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const edge = x < t || x >= w - t || y < t || y >= h - t;
      if (!edge) continue;
      const { x: cx, y: cy } = closestPointOnInnerRect(x, y, t, w, h);
      const { r, g, b } = getRgbSmooth(cx, cy, smoothRadius);
      const j = stripGrain(x, y, grain);
      const i = (y * w + x) * outChannels;
      buf[i] = clampByte(r + j);
      buf[i + 1] = clampByte(g + j);
      buf[i + 2] = clampByte(b + j);
      buf[i + 3] = 255;
    }
  }
  return buf;
}

async function main() {
  const { input, webp, borderPx, grain, base, smoothRadius } = parseArgs();

  if (!fs.existsSync(input)) {
    console.error(`Source not found: ${input}`);
    console.error(
      `Place your master OG image at public/brand/og-source.png or pass --input`,
    );
    process.exit(1);
  }

  if (borderPx * 2 >= TARGET_W || borderPx * 2 >= TARGET_H) {
    console.error(`Border ${borderPx}px is too large for canvas.`);
    process.exit(1);
  }

  const fullBleed = await sharp(input)
    .resize(TARGET_W, TARGET_H, { fit: "cover", position: "centre" })
    .ensureAlpha()
    .png()
    .toBuffer();

  let rgba;
  if (base === "edge") {
    const { data, info } = await sharp(fullBleed)
      .raw()
      .toBuffer({ resolveWithObject: true });
    rgba = buildEdgeOverlayRgbaFromSource(
      data,
      info.width,
      info.height,
      info.channels,
      borderPx,
      grain,
      smoothRadius,
    );
  } else {
    const paper =
      base === "white"
        ? { r: 255, g: 255, b: 255 }
        : await samplePaperFromPanel(fullBleed);
    const { r, g, b } = paper;
    rgba = buildEdgeOverlayRgba(
      borderPx,
      TARGET_W,
      TARGET_H,
      r,
      g,
      b,
      grain,
    );
  }
  const overlayPng = await sharp(rgba, {
    raw: {
      width: TARGET_W,
      height: TARGET_H,
      channels: 4,
    },
  })
    .png()
    .toBuffer();

  const outBuf = await sharp(fullBleed)
    .composite([{ input: overlayPng, left: 0, top: 0, blend: "over" }])
    .png()
    .toBuffer();

  await sharp(outBuf).png({ compressionLevel: 9 }).toFile(OUT_PNG);

  const meta = await sharp(OUT_PNG).metadata();
  const baseNote =
    base === "edge"
      ? `base edge (closest inner point + smooth ${smoothRadius})`
      : base === "white"
        ? "base white #fff"
        : "base sample (regional avg rgb)";
  console.log(
    `Wrote ${path.relative(ROOT, OUT_PNG)} (${meta.width}×${meta.height}, overlay ${borderPx}px, ${baseNote}, grain ${grain})`,
  );

  if (webp) {
    await sharp(OUT_PNG).webp({ quality: 90, effort: 6 }).toFile(OUT_WEBP);
    const st = fs.statSync(OUT_WEBP);
    console.log(
      `Wrote ${path.relative(ROOT, OUT_WEBP)} (${(st.size / 1024).toFixed(1)} KB)`,
    );
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
