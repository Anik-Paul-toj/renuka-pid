/**
 * Generates all required PWA icon sizes from the Renuka Art Studio logo.
 * Run with: node scripts/generate-pwa-icons.mjs
 */
import sharp from "sharp";
import { promises as fs } from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, "..");
const src = path.join(root, "public/images/renuka-art-studio-logo-black.png");
const iconsDir = path.join(root, "public/icons");

await fs.mkdir(iconsDir, { recursive: true });

const meta = await sharp(src).metadata();
console.log("Source:", meta.width, "x", meta.height, meta.format);

// Cream background matches site --background: #F7F4EC
const bg = { r: 247, g: 244, b: 236, alpha: 1 };

// Standard square icons
const sizes = [72, 96, 128, 144, 152, 192, 384, 512];
for (const size of sizes) {
  await sharp(src)
    .resize(size, size, { fit: "contain", background: bg })
    .png()
    .toFile(path.join(iconsDir, `icon-${size}x${size}.png`));
  console.log(`icon-${size}x${size}.png`);
}

// Apple touch icon 180x180
await sharp(src)
  .resize(180, 180, { fit: "contain", background: bg })
  .png()
  .toFile(path.join(iconsDir, "apple-touch-icon.png"));
console.log("apple-touch-icon.png");

// Maskable icon 512x512 — logo at ~70% scale to keep content inside the
// maskable safe zone (innermost 80% circle of the canvas)
const maskableSize = 512;
const logoSize = Math.round(maskableSize * 0.7); // ~358px; leaves ~77px padding
const pad = Math.floor((maskableSize - logoSize) / 2);
const padExtra = maskableSize - logoSize - pad;

const logoBuffer = await sharp(src)
  .resize(logoSize, logoSize, {
    fit: "contain",
    background: { r: 247, g: 244, b: 236, alpha: 0 },
  })
  .png()
  .toBuffer();

await sharp(logoBuffer)
  .extend({
    top: pad,
    bottom: padExtra,
    left: pad,
    right: padExtra,
    background: bg,
  })
  .png()
  .toFile(path.join(iconsDir, "icon-maskable-512x512.png"));
console.log("icon-maskable-512x512.png");

// Small favicons (placed directly in public/ for <link rel="icon"> fallback)
await sharp(src)
  .resize(32, 32, { fit: "contain", background: bg })
  .png()
  .toFile(path.join(iconsDir, "favicon-32x32.png"));
console.log("favicon-32x32.png");

await sharp(src)
  .resize(16, 16, { fit: "contain", background: bg })
  .png()
  .toFile(path.join(iconsDir, "favicon-16x16.png"));
console.log("favicon-16x16.png");

console.log("\nAll PWA icons generated successfully.");
