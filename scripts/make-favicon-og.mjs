/**
 * Generates the dark-context brand images: the favicon bundle and the
 * social link-preview (Open Graph) card. Run manually after a brand-asset
 * change — after scripts/make-reverse-logo.mjs, whose outputs this reads:
 *
 *   node scripts/make-reverse-logo.mjs
 *   node scripts/make-favicon-og.mjs
 *
 * then commit the outputs in public/. Not part of the build.
 *
 * Favicons render on light AND dark tab bars, so the reverse mark gets its
 * own dark surface: a solid navy #022A56 tile (rounded for browser tabs,
 * full-bleed for apple-touch-icon — iOS applies its own mask). The OG card
 * is a 1200×630 dark panel with the reverse lockup, so link previews stay
 * legible in dark-mode chat apps where navy ink on transparency vanishes.
 */
import sharp from 'sharp';

const NAVY = '#022A56';
const MARK = 'src/assets/xtend-ai-mark-reverse.png'; // 431×399
const WORDMARK = 'src/assets/xtend-ai-wordmark-white.png'; // 744×135

const roundedTile = (size, radius) =>
  Buffer.from(
    `<svg width="${size}" height="${size}"><rect width="${size}" height="${size}" rx="${radius}" fill="${NAVY}"/></svg>`
  );

async function faviconMaster(size, { rounded }) {
  const markWidth = Math.round(size * 0.64);
  const mark = await sharp(MARK).resize({ width: markWidth }).toBuffer();
  const markHeight = Math.round((markWidth * 399) / 431);
  return sharp(roundedTile(size, rounded ? Math.round(size * 0.18) : 0))
    .composite([
      {
        input: mark,
        left: Math.round((size - markWidth) / 2),
        top: Math.round((size - markHeight) / 2),
      },
    ])
    .png();
}

/** ICO container with PNG-compressed entries (valid since Vista). */
function buildIco(pngs) {
  const count = pngs.length;
  const header = Buffer.alloc(6);
  header.writeUInt16LE(0, 0); // reserved
  header.writeUInt16LE(1, 2); // type: icon
  header.writeUInt16LE(count, 4);
  const entries = [];
  let offset = 6 + 16 * count;
  for (const { size, data } of pngs) {
    const e = Buffer.alloc(16);
    e.writeUInt8(size === 256 ? 0 : size, 0); // width (0 = 256)
    e.writeUInt8(size === 256 ? 0 : size, 1); // height
    e.writeUInt8(0, 2); // palette
    e.writeUInt8(0, 3); // reserved
    e.writeUInt16LE(1, 4); // planes
    e.writeUInt16LE(32, 6); // bpp
    e.writeUInt32LE(data.length, 8);
    e.writeUInt32LE(offset, 12);
    entries.push(e);
    offset += data.length;
  }
  return Buffer.concat([header, ...entries, ...pngs.map((p) => p.data)]);
}

async function makeFavicons() {
  const master = await (await faviconMaster(512, { rounded: true })).toBuffer();
  for (const size of [512, 256, 192, 128, 64, 32, 16]) {
    const out = `public/xtend-ai_favicon_${size}.png`;
    await sharp(master).resize(size).png().toFile(out);
    console.log(`wrote ${out}`);
  }
  // apple-touch-icon: full-bleed, iOS rounds it itself
  await (await faviconMaster(180, { rounded: false })).toFile('public/xtend-ai_favicon_180.png');
  console.log('wrote public/xtend-ai_favicon_180.png');

  const icoPngs = [];
  for (const size of [16, 32, 48]) {
    icoPngs.push({ size, data: await sharp(master).resize(size).png().toBuffer() });
  }
  const { writeFile } = await import('node:fs/promises');
  await writeFile('public/favicon.ico', buildIco(icoPngs));
  console.log('wrote public/favicon.ico');
}

/** 1200×630 card: dark base + the site hero's blue glow + reverse lockup. */
async function makeOgCard() {
  const W = 1200, H = 630;
  const bg = Buffer.from(`<svg width="${W}" height="${H}">
    <defs>
      <linearGradient id="base" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0" stop-color="#0a0a0f"/>
        <stop offset="1" stop-color="#12121a"/>
      </linearGradient>
      <radialGradient id="glow" cx="0.5" cy="0.15" r="0.9">
        <stop offset="0" stop-color="#188CFF" stop-opacity="0.22"/>
        <stop offset="0.7" stop-color="#188CFF" stop-opacity="0"/>
      </radialGradient>
    </defs>
    <rect width="${W}" height="${H}" fill="url(#base)"/>
    <rect width="${W}" height="${H}" fill="url(#glow)"/>
  </svg>`);

  const markH = 250;
  const markW = Math.round((markH * 431) / 399);
  const wordH = 92;
  const wordW = Math.round((wordH * 744) / 135);
  const gap = 48;
  const top = Math.round((H - (markH + gap + wordH)) / 2);
  const mark = await sharp(MARK).resize({ height: markH }).toBuffer();
  const word = await sharp(WORDMARK).resize({ height: wordH }).toBuffer();

  await sharp(bg)
    .composite([
      { input: mark, left: Math.round((W - markW) / 2), top },
      { input: word, left: Math.round((W - wordW) / 2), top: top + markH + gap },
    ])
    .png()
    .toFile('public/images/og-card.png');
  console.log('wrote public/images/og-card.png');
}

await makeFavicons();
await makeOgCard();
