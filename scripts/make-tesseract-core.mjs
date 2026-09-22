/**
 * Turns Higgsfield's energy-core renders into the RGBA glow stills the hero
 * tesseract layers behind its cage (HeroTesseract.astro, `coreA` / `coreB`).
 * Run manually after new renders land in video-masters/stills/ (gitignored):
 *
 *   node scripts/make-tesseract-core.mjs
 *
 * then commit the outputs in src/assets/hero/. Not part of the build.
 *
 * Uses sharp, which Astro already ships; no new dependency.
 *
 * Why the keying: the renders (gpt_image_2_5, `background: transparent`)
 * come back with a transparent margin but an OPAQUE dark disc under the glow.
 * Layered with normal blending, that disc would cover the clip behind the
 * cube. So each pixel's coverage becomes its brightness (alpha = brightest
 * channel) and its colour is unpremultiplied to match: dark pixels turn
 * transparent, dim wisps become faint light, and over any backdrop the layer
 * behaves like light without a runtime blend mode (which would cost the
 * compositor a read-back of the video layer under it). A radial vignette
 * guarantees zero alpha at the edge, so the CSS counter-rotation can never
 * show a square. Two guards keep the unpremultiply honest: colour is never
 * amplified beyond about 3x (faint navy noise would otherwise come out as
 * saturated green), coverage below 5% is dropped, and every pixel is forced
 * blue-dominant (r <= 0.7 g <= b), which is the brand palette anyway. 1024 px
 * is plenty for a box that tops out at 544 px.
 */
import { mkdirSync } from 'node:fs';
import sharp from 'sharp';

const SOURCES = {
  a: 'video-masters/stills/core-a.png',
  b: 'video-masters/stills/core-b.png',
};
const OUT = 'src/assets/hero';
const SIZE = 1024;
const VIGNETTE_START = 0.72; // fraction of the radius where the fade to transparent begins
const VIGNETTE_END = 0.9; // ... and where it reaches zero
const MIN_K = 0.34; // colour amplification floor (1 / MIN_K = about 3x)
const MIN_ALPHA = 0.05; // coverage below this is noise

mkdirSync(OUT, { recursive: true });

for (const [name, src] of Object.entries(SOURCES)) {
  const { data, info } = await sharp(src).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
  const { width: W, height: H } = info;
  const cx = W / 2, cy = H / 2, R = Math.min(W, H) / 2;
  let kept = 0;
  for (let y = 0; y < H; y++) {
    for (let x = 0; x < W; x++) {
      const i = (y * W + x) * 4;
      const r = data[i], g = data[i + 1], b = data[i + 2];
      const k = Math.max(r, g, b) / 255; // brightness as coverage
      const d = Math.hypot(x - cx, y - cy) / R;
      const vig = d < VIGNETTE_START ? 1 : d > VIGNETTE_END ? 0 : 1 - (d - VIGNETTE_START) / (VIGNETTE_END - VIGNETTE_START);
      const a = (data[i + 3] / 255) * k * vig;
      if (a < MIN_ALPHA) { data[i] = 0; data[i + 1] = 0; data[i + 2] = 0; data[i + 3] = 0; continue; }
      // Unpremultiply (bounded): the colour a pixel of this coverage needs so
      // that over black it reproduces the render, then keep it blue.
      const kk = Math.max(k, MIN_K);
      let cr = Math.min(255, Math.round(r / kk)), cg = Math.min(255, Math.round(g / kk)), cb = Math.min(255, Math.round(b / kk));
      if (cg > cb) cg = cb;
      if (cr > cg * 0.7) cr = Math.round(cg * 0.7);
      data[i] = cr; data[i + 1] = cg; data[i + 2] = cb;
      data[i + 3] = Math.round(a * 255);
      kept++;
    }
  }
  const out = `${OUT}/tesseract-core-${name}.png`;
  await sharp(data, { raw: { width: W, height: H, channels: 4 } })
    .resize(SIZE, SIZE, { kernel: 'lanczos3' })
    .png({ compressionLevel: 9 })
    .toFile(out);
  console.log(`wrote ${out} (${((kept / (W * H)) * 100).toFixed(1)}% of source pixels carry light)`);
}
