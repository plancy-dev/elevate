/**
 * Generates PNG + ICO + apple-touch-icon from public/brand/elevate-mark.svg
 * Run: node scripts/generate-brand-assets.mjs
 */
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import sharp from "sharp";
import toIco from "to-ico";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, "..");
const svgPath = path.join(root, "public/brand/elevate-mark.svg");
const svg = fs.readFileSync(svgPath);

async function main() {
  const png512 = await sharp(svg).resize(512, 512).png().toBuffer();
  fs.writeFileSync(path.join(root, "public/brand/elevate-mark-512.png"), png512);

  const [buf16, buf32, buf180] = await Promise.all([
    sharp(svg).resize(16, 16).png().toBuffer(),
    sharp(svg).resize(32, 32).png().toBuffer(),
    sharp(svg).resize(180, 180).png().toBuffer(),
  ]);

  const ico = await toIco([buf16, buf32]);
  fs.writeFileSync(path.join(root, "public/favicon.ico"), ico);
  fs.writeFileSync(path.join(root, "public/apple-touch-icon.png"), buf180);

  const png192 = await sharp(svg).resize(192, 192).png().toBuffer();
  fs.writeFileSync(path.join(root, "public/brand/elevate-mark-192.png"), png192);

  console.log("Wrote public/favicon.ico, public/apple-touch-icon.png, public/brand/*.png");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
