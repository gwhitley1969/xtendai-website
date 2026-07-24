/**
 * Generates the dark-background ("reverse") logo assets from the transparent
 * brand PNGs in public/images/. Run manually after a brand-asset change:
 *
 *   node scripts/make-reverse-logo.mjs
 *
 * then commit the outputs in src/assets/. Not part of the build.
 *
 * Uses sharp, which Astro already ships — no new dependency.
 *
 * Reverse treatment (XTEND-AI-WEB.md §12): on dark surfaces the navy ink
 * inverts to white; brand blue #188CFF stays constant.
 *
 * The source PNGs are background-removed rasters with binary alpha (no
 * semi-transparent pixels) — anti-aliasing is baked in as opaque color
 * blends, including near-white fringe left over from background removal.
 * The per-pixel rules below account for that; see docs/IMPLEMENTATION.md.
 */
import sharp from 'sharp';

// Measured inks (pixel-sampled, not the nominal brand hexes):
//   navy ≈ rgb(1, 40, 83)   green channel ≈ 40
//   blue ≈ rgb(26, 142, 255) green channel ≈ 142
const G_NAVY = 40;
const G_BLUE = 142;
const BLUE = { r: 24, g: 140, b: 255 }; // output blue = --xt-accent #188CFF

const clamp01 = (x) => Math.min(1, Math.max(0, x));

async function loadRaw(file) {
  return sharp(file).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
}

async function saveRaw(data, info, file) {
  await sharp(data, {
    raw: { width: info.width, height: info.height, channels: 4 },
  })
    .png()
    .toFile(file);
  console.log(`wrote ${file} (${info.width}x${info.height})`);
}

/**
 * X mark: navy stroke → white, blue stroke → #188CFF, blends interpolated
 * on the green channel (the axis that separates the two inks). Near-white
 * fringe must be caught FIRST — its green ≈ 255 would land t = 1 and paint
 * it blue, speckling the stroke edges.
 */
async function makeMarkReverse() {
  const { data, info } = await loadRaw('public/images/xtend-ai_mark_transparent.png');
  for (let i = 0; i < data.length; i += 4) {
    if (data[i + 3] === 0) continue;
    const r = data[i], g = data[i + 1], b = data[i + 2];
    const mx = Math.max(r, g, b), mn = Math.min(r, g, b);
    if (mx > 190 && mx - mn < 60) {
      data[i] = data[i + 1] = data[i + 2] = 255;
      continue;
    }
    const t = clamp01((g - G_NAVY) / (G_BLUE - G_NAVY));
    data[i] = Math.round(255 + t * (BLUE.r - 255));
    data[i + 1] = Math.round(255 + t * (BLUE.g - 255));
    data[i + 2] = Math.round(255 + t * (BLUE.b - 255));
  }
  await saveRaw(data, info, 'src/assets/xtend-ai-mark-reverse.png');
}

/**
 * Wordmark: white ink with alpha derived from darkness. The source ink is
 * uniformly navy and its anti-aliasing is baked against a white background,
 * so "how dark is this pixel" IS its ink coverage — mapping that to alpha
 * turns the baked blend into true alpha anti-aliasing instead of hardening
 * every edge to solid white.
 */
async function makeWordmarkWhite() {
  const { data, info } = await loadRaw('public/images/xtend-ai_wordmark_transparent.png');
  const luma = (r, g, b) => (0.2126 * r + 0.7152 * g + 0.0722 * b) / 255;
  const LUMA_NAVY = luma(1, 40, 83);
  for (let i = 0; i < data.length; i += 4) {
    const ink = clamp01((1 - luma(data[i], data[i + 1], data[i + 2])) / (1 - LUMA_NAVY));
    data[i] = data[i + 1] = data[i + 2] = 255;
    data[i + 3] = Math.round(ink * data[i + 3]);
  }
  await saveRaw(data, info, 'src/assets/xtend-ai-wordmark-white.png');
}

await makeMarkReverse();
await makeWordmarkWhite();
