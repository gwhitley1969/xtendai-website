# Implementation Notes

Practical reference for the Xtend-AI corporate site. `README.md` covers setup and deployment; this document covers **how things are organized inside the code** — design tokens, asset pipeline, Astro patterns, and common gotchas. `XTEND-AI-WEB.md` is the product brief (what the site is); this is the engineering companion (how it's built).

## Table of Contents

- [Design System](#design-system)
- [Asset Pipeline](#asset-pipeline)
- [Astro Patterns](#astro-patterns)
- [Icon Placement Map](#icon-placement-map)
- [Ambient video](#ambient-video)
- [Hero tesseract](#hero-tesseract)
- [Deployment Quirks](#deployment-quirks)
- [Known Gotchas](#known-gotchas)

---

## Design System

All design tokens are defined on `:root` in `src/styles/global.css` and consumed via `var(--token-name)`. Do not introduce raw hex values in component scoped styles — add or reuse a token instead.

### Brand palette (from the Xtend-AI logo)

| Token | Value | Role |
|---|---|---|
| `--xt-navy-deep` | `#00052A` | Deepest navy, reserved for dark accents |
| `--xt-navy` | `#022A56` | Brand navy — button base, gradient start |
| `--xt-accent` | `#188CFF` | Brand pop; replaces the legacy `--xt-purple` that was inherited from the My AI Bartender app |
| `--xt-accent-light` | `#7EC1FF` | Lighter accent for hover states and text-on-dark |
| `--xt-link` | `#0B6FE6` | Links on white backgrounds (WCAG AA-safe contrast) |

### Dark-theme surfaces

| Token | Value | Role |
|---|---|---|
| `--xt-bg-primary` | `#0a0a0f` | Page background |
| `--xt-bg-secondary` | `#12121a` | Section variations |
| `--xt-bg-card` | `#1a1a24` | Card surfaces |
| `--xt-bg-card-hover` | `#222230` | Card hover state |
| `--xt-bg-elevated` | `#252532` | Elevated panels |

### Supporting palette (feature-icon variety)

These are **not** brand colors — they're illustrative chrome for the feature-icon circles.

| Token | Value | Role |
|---|---|---|
| `--xt-blue` | `#3b82f6` | Secondary blue (feature icons, `hero__glow--2`) |
| `--xt-blue-light` | `#60a5fa` | Currently unused |
| `--xt-cyan` | `#22d3ee` | Feature icons, global link hover color |
| `--xt-coral` | `#f472b6` | **Misnamed — actually pink**; feature icons, form `required` marker + error state |
| `--xt-gold` | `#fbbf24` | Feature icons, "In progress" status badge, 21+ notice |
| `--xt-green` | `#34d399` | Feature icons, app "Live" status lines on `/work`, form success state |
| `--xt-phone-screen-bg` | `#10091f` | Sampled from the hero phone screenshot's page background — fills the frame below the cropped capture so it reads as the same screen |

> **Icon-circle stroke colors are contrast-driven.** The glyphs inside `.icon-circle` are `currentColor` stroke SVGs: white on the dark fills (`--accent`, `--blue`), `--xt-bg-primary` on the light fills (`--green`, `--gold`, `--coral`, `--cyan`) — white on those four computes 1.7–2.6:1, under the 3:1 non-text minimum. The variant rules live next to `.icon-circle` in `global.css`; a new circle color needs its stroke side chosen the same way.

### Text

| Token | Value | Role |
|---|---|---|
| `--xt-text-primary` | `#ffffff` | Primary text on dark bg |
| `--xt-text-secondary` | `#a1a1aa` | Muted text (descriptions, metadata) |
| `--xt-text-muted` | `#8a8a94` | Placeholders, captions, footer copy |

> `--xt-text-muted` was `#71717a` until 2026-07-24 — 3.85:1 against `--xt-bg-secondary`, a WCAG AA failure for the small text it's used on. `#8a8a94` clears 4.5:1 on all three surfaces muted text sits on (`#0a0a0f`, `#12121a`, `#1a1a24`) while staying visibly quieter than `--xt-text-secondary`. If you darken it again, Lighthouse accessibility drops on every page with a footer — which is every page.

### Fonts

Sora and Inter are **self-hosted**: two latin-subset variable woff2 files in `public/fonts/` (`sora-var.woff2` 25 KB covers 600–700, `inter-var.woff2` 48 KB covers 400–600), declared via `@font-face` at the top of `global.css` and preloaded in `BaseLayout.astro`. There is no Google Fonts request — the third-party chain (render CSS from one origin, woff2 from a second, late text repaint on swap) was the largest simulated-mobile LCP cost on every page.

Gotchas if you touch this:
- `crossorigin` is required on font preloads **even same-origin**, or the browser fetches each file twice.
- A new weight outside the declared ranges needs the `@font-face` `font-weight` range widened — the variable files already contain all weights.
- `.woff2` has an explicit MIME mapping in `staticwebapp.config.json`.

### Form primitives

`.form-input`, `.form-select`, and `.form-textarea` share one style block in `global.css`. The block sets `color-scheme: dark` so the **native** select arrow and popup list render with the browser's dark UA styling — do not replace this with a custom chevron background image. A required `<select>` with a disabled empty first option matches `:invalid` until a choice is made; `.form-select:invalid` uses that to render the placeholder state in `--xt-text-muted`.

### Gradients

| Token | Value | Role |
|---|---|---|
| `--xt-gradient-brand` | `linear-gradient(135deg, #022A56 0%, var(--xt-link) 100%)` | Primary CTAs, process-step numerals. Ends on `--xt-link` (`#0B6FE6`), **not** `--xt-accent`: white button text over `#188CFF` is ~3.4:1 — an AA fail at button text sizes — while `#0B6FE6` clears 4.5:1 (2026-07-25). |
| `--xt-gradient-accent-text` | `linear-gradient(135deg, #188CFF 0%, #7EC1FF 100%)` | `.text-gradient` — **h1 hero headlines only** since the 2026-07-25 audit (one gradient phrase per page; section h2s are solid) |
| `--xt-gradient-card` | `linear-gradient(145deg, rgba(24, 140, 255, 0.1) 0%, rgba(59, 130, 246, 0.05) 100%)` | `.card--glow` subtle background |

> `--xt-gradient-blue` (brand duplicate), `--xt-gradient-glow` (fed the removed `.section--glow`), `--xt-gradient-hero`, and `--xt-gradient-warm` were deleted 2026-07-25 — zero users each.

### Reduced motion

`global.css` ends with a blanket `@media (prefers-reduced-motion: reduce)` block: every animation and transition collapses to 0.01 ms (duration **and** delay) and smooth scroll turns off. New CSS animations are covered automatically; do not add per-component reduced-motion CSS overrides. It cannot reach a `<video>` or a JavaScript animation loop, though: those check `matchMedia('(prefers-reduced-motion: reduce)')` themselves and listen for its `change` event (see *Ambient video*). `transition-delay` is zeroed deliberately: the mobile menu delays its `visibility` flip by `--transition-base` so the slide-out animation stays visible, and with the slide collapsed the delay must collapse with it or the menu would hang open invisibly for 250 ms. `animation-delay` is zeroed for the same reason: the home hero's staggered entrance hides elements at their `from` frame (`fill-mode: both`) until each delay elapses, so a surviving delay would hold content invisible for reduced-motion users.

### Legacy aliases

These point at the same values as canonical tokens and exist for back-compat with older call sites:

| Legacy | Value | Canonical equivalent |
|---|---|---|
| `--xt-navy-950` | `#0a0a0f` | `--xt-bg-primary` |
| `--xt-navy-900` | `#12121a` | `--xt-bg-secondary` |
| `--xt-blue-500` | `#3b82f6` | `--xt-blue` |
| `--xt-blue-600` | `#188CFF` | `--xt-accent` |
| `--xt-white` | `#ffffff` | — |

> **⚠️ Variable-name collision with `xtend-ai_brand_tokens.css`** — there is a standalone `xtend-ai_brand_tokens.css` file in the repo root (shipped with the original brand assets) that defines **the same variable names with different values** (e.g., it defines `--xt-navy-900: #022A56`, not `#12121a`). That file is **not imported anywhere** in the site. Do not import it — the collision would silently swap backgrounds, text colors, and legacy aliases. Treat it as a reference-only artifact.

---

## Asset Pipeline

Two places to put images, with different semantics:

### `src/assets/` — images processed by `<Image>`

Images here are imported as ES modules in page frontmatter and rendered with the `<Image>` component from `astro:assets`. Astro produces optimized WebP variants at requested sizes/densities at build time, writes them to `dist/assets/` with content-addressed filenames, and emits `<img>` tags with correct `srcset`, `width`, `height`, and `alt`.

**Use this for any raster image the site renders.** A 1.7 MB source PNG drops to ~2–12 KB per output variant.

Example — home-page phone-mock icon (`src/pages/index.astro`):

```astro
---
import { Image } from 'astro:assets';
import bartenderIcon from '../assets/my-ai-bartender-icon.png';
---

<Image
  src={bartenderIcon}
  alt=""
  width={36}
  height={36}
  densities={[2, 3]}
  loading="eager"
/>
```

Density conventions for fixed-size UI chrome:
- `width`/`height` set the base (1x) render size and prevent layout shift on load.
- `densities={[2, 3]}` generates 2× and 3× variants — browsers pick from `srcset` based on device DPR.
- `loading="eager"` for above-the-fold elements; omit (Astro's default `lazy`) for below-the-fold.

Astro deduplicates output files by size+hash, so identical variants across multiple import sites share one generated file. Confirmed during the products-listing icon addition (page since retired — `/products` now 301s to `/work`): a 72 px 1x variant reused the 72 px file that had been generated as 2x for the home-page icon. The same dedup applies to today's call sites — e.g. the 72 px icons on `/work` share variants with the product detail heroes.

### `public/` — files served at a fixed URL with no processing

Use `public/` only for:
- Favicons (`/favicon.ico`, `/xtend-ai_favicon_*.png`)
- `robots.txt`, sitemap overrides
- Files that must be referenced by an exact path (e.g., third-party domain validators)
- Files that leave the site at a fixed URL: `/images/og-card.png` (the link-preview card) and the transparent brand originals in `public/images/`, which the reverse-logo script reads and the Organization JSON-LD points at

Anything in `public/` is copied verbatim to the build output. A large PNG placed here ships at its full source size to every visitor — avoid this for anything a page references via `<Image>`.

---

## Astro Patterns

### Scoped styles + `<Image>` needs `:global(img)`

Astro scopes `<style>` blocks by adding a `data-astro-cid-<hash>` attribute to elements in the template and rewriting selectors to match that attribute. For inline template elements this is seamless; for elements emitted by Astro **components** (like `<Image>`), the inner `<img>` gets the scope attribute but attribute-based descendant targeting is brittle. The reliable pattern:

```css
.wrapper :global(img) {
  width: 100%;
  height: 100%;
  object-fit: cover;
}
```

`:global()` opts the `img` selector out of scoping. Used at every `<Image>` call site — the header and footer logo, the home hero phone screenshot, the `/work` app cards, and both product detail heroes (see the Icon Placement Map).

### Scoped inline SVG — no `:global()` needed

When you inline an `<svg>` directly in a template rather than via a component, Astro stamps the scope attribute on it like any other element, so scoped selectors reach it without `:global()` — the arrow glyphs inside the CTA buttons are written this way. The exception is SVG injected via `set:html` (the `Icon.astro` glyphs): injected markup gets **no** scope attribute, so page-scoped CSS must use `:global(svg)` — see *Stroke icon glyphs* in the Icon Placement Map. (The original example here, the phone mock's profile-avatar SVG, was deleted with the mock on 2026-07-25.)

**Rule of thumb**: `:global()` is needed for elements emitted by Astro components; not for raw HTML/SVG in the template.

### Design-token CSS custom properties are global by design

Tokens defined in `src/styles/global.css`'s `:root` block are accessible to every component. A custom property set inside a scoped `<style>` block is **not** scoped away from children: scoping only restricts which elements the *selector* matches, and the property then inherits down the DOM like any other. `index.astro` sets `--rise-*` and `--ambient-*` on `.hero` in its scoped block and `AmbientVideo.astro` reads them from inside; that is the sanctioned way to hand knobs to a child component (set them on an ancestor, the child reads `var(--knob, default)`).

### Shared components

- **`StoreLinks.astro`** — App Store + Google Play buttons. Three pages render them (`/work` and both product detail pages); the SVG paths drifted when hand-copied. Takes `appName` solely to build distinct `aria-label`s — `/work` renders two pairs, and "Download on the App Store" twice tells a screen-reader user nothing about which app.
- **`FeatureCard.astro`** — icon + title + description card. Has an `align` prop: `center` for short teaser copy, `start` for full paragraphs (centred text is hard to track past ~2 lines). Its text colors are the semantic tokens — see History notes for the `--xt-navy-900` trap that made it unusable before 2026-07-24.

### JSON-LD and the head slot

`BaseLayout.astro` exposes `<slot name="head" />` inside `<head>` and emits an `Organization` JSON-LD block on every page. Page-specific structured data slots in from the page — `/services` contributes `ProfessionalService` this way:

```astro
<BaseLayout title={title} description={description}>
  <script slot="head" is:inline type="application/ld+json" set:html={JSON.stringify(schema)} />
```

Both `is:inline` and `set:html` matter: without `is:inline` Astro processes the script; without `set:html` the JSON is HTML-escaped (`&` → `&amp;`), which breaks parsing.

### Active-nav section map

`Header.astro` highlights nav items by URL prefix, plus a `navSectionFor` map for URLs that live outside the nav but belong to a section — `/products/*` pages highlight **Work**, since Products is no longer a nav item and those pages are reached from `/work`. New nav-orphan URLs get an entry there, or the header shows no active item on them. The mobile menu applies the same active state.

---

## Icon Placement Map

Sources in `src/assets/`: `my-ai-bartender-icon.png`, `clique-pix-icon.png` (from `CLIQUE_Pix/play_app_icon_512x512.png`), and the three **reverse logo assets** `xtend-ai-mark-reverse.png` (431 × 399), `xtend-ai-wordmark-white.png` (744 × 135), and `xtend-ai-mark-watermark.png` (1024 w — the mark upscaled and slightly blurred, because the 431px source's hard binary-alpha edges stair-step when CSS scales it to viewport size).

### Reverse logo assets

The brand PNGs in `public/images/` use navy ink drawn for white surfaces — invisible on this site's dark chrome. `scripts/make-reverse-logo.mjs` (run manually: `node scripts/make-reverse-logo.mjs`, then commit the outputs; sharp comes with Astro) generates the dark-surface variants:

- **Mark**: navy stroke → white, blue stays `#188CFF` (the `--xt-accent` value), blends interpolated on the green channel — the axis that separates the two inks. A near-white **fringe guard runs first**: the sources are background-removed rasters with binary alpha, and ~850 near-white leftover pixels would otherwise classify as "blue" and speckle the stroke edges.
- **Wordmark**: white ink with **alpha derived from pixel darkness**. The source's anti-aliasing is baked against white at full alpha; darkness-as-coverage converts it to true alpha anti-aliasing instead of hardening every edge to solid white.

A second script, `scripts/make-favicon-og.mjs` (run after the first — it reads the reverse assets), regenerates the brand images that leave the site: the favicon bundle in `public/` (reverse mark on a solid navy `#022A56` tile so it survives light *and* dark tab bars; `favicon.ico` is hand-built PNG-in-ICO at 16/32/48; the 180 apple-touch-icon is full-bleed because iOS applies its own mask) and `public/images/og-card.png`, the 1200×630 dark link-preview card that `BaseLayout.astro` uses as the `ogImage` default. Sharp quirk worth knowing in both scripts: `.composite()` always runs **after** `.resize()` in the libvips pipeline regardless of call order — composite and resize in separate sharp invocations when the order matters.

| Page | File | Image | Size | Treatment |
|---|---|---|---|---|
| Every page — header | `src/components/Header.astro` | mark + wordmark | 56/72 h + 30/38 h | reverse lockup, mark beside wordmark, eager (the tagline left the header on 2026-09-22) |
| Every page — footer | `src/components/Footer.astro` | mark + wordmark | 28 h + 18 h | reverse lockup, lazy |
| Every page — letterhead watermark | `src/layouts/BaseLayout.astro` | watermark | `min(90vw, 97vh)` | fixed + centered, all viewports; `.site-watermark` in global.css, opacity `--xt-watermark-opacity` (6%), z-index 90 (above opaque section backgrounds, below header 100 / menu 99 / skip-link 1000), srcset 512/1024 |
| Home — hero tesseract core | `src/components/HeroTesseract.astro` (rendered by `index.astro`) | mark + wordmark | lockup 0.34 × box (mark 52% of the lockup width) | drawn on the canvas between the far and near edges, on a dark pocket; the DOM copy is the no-JS fallback and the bitmap source, eager |
| Work — app cards | `src/pages/work.astro` | both apps | 72 × 72 | 22% squircle, soft drop shadow |
| Product detail — hero | `products/my-ai-bartender.astro` | bartender | 120 × 120 | 22% squircle, centered below H1 |
| Product detail — hero | `products/clique-pix.astro` | CLIQUE Pix | 120 × 120 | 22% squircle, centered below H1 |

All placements go through `<Image>` with `densities={[2, 3]}` (except the watermark — a 6% opacity ghost needs no retina variants). Astro generates per-site size/density variants and deduplicates identical outputs.

### Hero phone screenshot (retired 2026-09-22)

From 2026-07-25 to 2026-09-22 the hero phone frame rendered a real My AI Bartender home-screen capture (the screen-glass interior cropped from the Play listing's "Premium Mixology Experience" render, ending below the Recipe Vault card, 500 px wide; neither store listing publishes a full-height raw capture). It went with the phone when the tesseract took the column (see *Hero tesseract*). Should a product capture return elsewhere: `git show ecf2bc7:src/assets/my-ai-bartender-screen.png`, and re-crop from the listing (`=h2400` size suffix) after an app redesign.

### Stroke icon glyphs — `Icon.astro`

`src/components/Icon.astro` holds the site's icon dictionary: 18 outline glyphs **vendored from Tabler Icons v3.34.0 (MIT)** as inline SVG strings — 24 × 24, `stroke="currentColor"`, stroke-width 2, matching FeatureCard's larger hand-kept 48-grid set. No npm dependency; an unknown `name` **throws at build time** (pages are prerendered, so a typo fails `npm run build` instead of shipping a blank icon). Emoji are banned as icons (§12.5 of the brief): they can't take brand color (Known Gotcha #1) and they read as a second, unmatched icon language.

To add a glyph: download the outline SVG from the Tabler set, drop its `class` attribute and leading no-op bounding path, add `aria-hidden="true"`, paste as one line. **Scoping trap:** the SVG is emitted via `set:html`, so it carries no Astro scope attribute — page-scoped CSS must target it with `:global(svg)` (same mechanism as the `<Image>` rule above); the `width`/`height="24"` attributes on each glyph are the reliable default size.

> The letterhead watermark is the **LCP element on every viewport** (largest painted area beats the `<h1>` text block). Verified harmless 2026-07-24: ~49 KB WebP, paints ≈ 150–200 ms unthrottled; Lighthouse LCP 1.8 s mobile / 0.4 s desktop, all four categories 100 on both. If LCP ever regresses, look here first. In the header and footer the mark and wordmark are sized by **separate wrapper-scoped `:global(img)` selectors** — a shared `.header__logo :global(img)` rule would force both images to one height.

> The header logo previously shipped as a **775 KB PNG served raw from `public/images/`** — the site-wide mobile LCP element (simulated 5.4 s on slow 4G) — and then as a 1024² opaque "white chip" whose baked-in background made the lockup illegible at 48 px on the dark bar. If a redesigned logo asset arrives, it goes in `src/assets/`, never `public/`, and gets a reverse variant via the script above.

## Ambient video

The home hero runs a muted, decorative background clip: a flight over a cloudless blueprint lattice that plays once per visit, then holds its first frame as the still (reworked twice on 2026-09-22; the first version was a cloud sea with an opening ride and a locked-off loop, then a perpetual flight loop, see the generation record). AI-generated (Higgsfield), graded and encoded by `scripts/make-ambient-video.mjs`, shipped from `src/assets/video/`. Brand rules: `XTEND-AI-WEB.md` §4.1, §12.5, §13, §14.2.

### What ships

| File | Role | Size | Notes |
|---|---|---|---|
| `beneath-flight-d.mp4` | the flight, landscape (`(min-width: 1024px)`), plays once per visit | 3.98 MB | 1600×900, H.264 High L4.0, CRF 29, 24 fps, 479 frames (20 s, motion-interpolated to half speed from the 10 s render), played at 0.7× |
| `beneath-flight-m.mp4` | the flight, portrait, plays once per visit | 1.73 MB | 540×960, L3.1, CRF 28; the crop window travels 0.8 → 0.5 → 0.8 with the camera, following the vanishing point |
| `beneath-flight-d.png` / `-m.png` | first frame of each rendition | source PNGs | served as WebP (q70, largest variants 46 / 32 KB) under the clip, and held after it: the LCP element |

Budgets are enforced by the script (`budgetBytes` per rendition: 4.5 / 2 MB since the half-speed flight; 3.5 / 1.5 before); an over-budget file is deleted and the run fails. The masters (1920×1080 HEVC Main 10, 24 fps, 10 s, as Higgsfield delivers them) live in gitignored `video-masters/`. A fresh clone can build the site but not regenerate the clips; that is intended, the outputs are committed and the masters are large.

### Components

`AmbientVideo.astro` (props `desktop`, `mobile`, `desktopStill`, `mobileStill`, `desktopMedia`, `intro`, `introMobile`, `startDelay`, `minWidth`) renders `.ambient` > `.ambient__media[aria-hidden]` > `<picture>` still + `<video data-role="loop">` + optional `<video data-role="intro">` + `.ambient__scrim`. The `<video>` elements carry **no `autoplay`, no `src`, no `poster`**. The script assigns `src` after `load` + `startDelay` + idle, and only if nothing says no: reduced motion, Save-Data, 2g/3g, `deviceMemory ≤ 2`, a stored "off" choice, a hidden tab, an off-screen box, a viewport under `minWidth`. `NotAllowedError` (iOS Low Power Mode) cancels the download and never retries. One media query (`desktopMedia`) picks both the still and the rendition, so they always match. An optional opening clip (`intro` / `introMobile`) plays once per browser session (`sessionStorage['xt-ambient-intro']`). With a loop it buffers the loop during its own last two seconds and `ended` (or `error`) hands off with no fade (`is-handoff`); the loop is optional too, and without one the clip fades back to the still, which is its own first frame. The home page passes only the flight since 2026-09-22: it plays once, then the tesseract floats over the held view. Every clip pauses when scrolled out of view or when the tab is hidden, and resumes after a bfcache restore (`pageshow`).

`AmbientToggle.astro` is the WCAG 2.2.2 pause control: `<button data-ambient-toggle hidden>`, revealed by `AmbientVideo`'s script only while something plays (or after the visitor paused it, so it can be resumed), stored site-wide in `localStorage['xt-ambient']` and mirrored as `data-ambient-off` on `<html>` so pages can pause their own CSS loops with it. Render it as a sibling **after** the section's content wrapper (the content grid is `z-index: 1` and would swallow its clicks) and position it with `:global(.ambient-toggle)`. Honoring `prefers-reduced-motion` alone does not satisfy 2.2.2.

Knobs are inherited custom properties, set by the page on `.hero` (the `--rise-*` convention): `--ambient-video-opacity` (intensity, implemented as a surface-colour veil in the scrim rather than opacity on the video, which would dip mid-fade and cost an offscreen pass per frame), `--ambient-video-fade`, `--ambient-video-rate`, `--ambient-position`, `--ambient-max-height` (clamps the box, on phones to the first screen with `svh` so a collapsing URL bar cannot resize it), `--ambient-scrim-color`, the left/top/bottom fade stops, and `--ambient-plate-size / -at / -strength` (a soft dark ellipse behind a text block so bright footage can run under it). The home page's values were set by measuring contrast against real frames, and the hero title and subtitle carry layered dark text halos for the same reason. `--ambient-video-rate` applies to whichever clip starts; the home page plays the flight at 0.7 on top of footage already slowed to half speed (owner, 2026-09-22: the rendered speed was dizzying, then "slow it by about 50%"); below about 0.6 the 24 fps footage would visibly repeat frames, which is why the second halving was done in the footage, not the player. The flight plays at `--ambient-video-rate: 0.7` (owner, 2026-09-22: full speed was dizzying); the script applies the rate when it assigns the loop's `src`.

### The still is the LCP element (rule)

Measured with Lighthouse on a build that starts the clip at load: Chrome registers a `<video>` that fades in from opacity 0 as the LCP element, timed at its first visible frame. In production that would be load + delay + download, a late LCP that ordinary lab runs never see because they end before the clip exists. So every full-bleed clip sits over its own first-frame still, painted with the page at full strength (never from opacity 0, never inside a wrapper that animates from 0). The still becomes the LCP element at an early, truthful time; the video occupies the identical box, so it is never larger and cannot replace it; the clip then fades in over a pixel-identical frame. This is why `<AmbientVideo>` is placed **before** `.hero__bg` (which blooms from opacity 0), not inside it. To measure the worst case, `AMBIENT_DELAY_MS=0 npm run build` starts every clip at load; the gate is mobile Performance ≥ 95 with the LCP element still `img.ambient__still`.

### Stacking

`.ambient` has `isolation: isolate`: the layers inside carry z-indexes (intro 1, scrim 2) that must never compete with the page content at z-index 1, or the scrim dims the text it exists to protect (this happened). The intro rides above the loop so the loop is fully present underneath when the intro lifts; the scrim sits above both, because with the intro over it the headline measured 1.1-3.2:1 at the ride's brightest frames.

### Pipeline (`scripts/make-ambient-video.mjs`)

Run manually after a master lands in `video-masters/`; commit the outputs. The shipped flight master is a pre-step over the render: `ffmpeg -i beneath-flight-master.mp4 -an -vf "format=yuv420p,minterpolate=fps=48:mi_mode=mci:mc_mode=aobmc:me_mode=bidir:vsbmc=1:scd=none,setpts=2*PTS" -r 24 -c:v libx264 -preset medium -crf 10 -pix_fmt yuv420p beneath-flight-slow-master.mp4` (motion-vector interpolation to twice the frames, re-timed to 24 fps = half speed; about two minutes; mid-flight frames checked for artifacts before use). Per clip: `ffprobe` the master (fps and frame count are read, never assumed) → lossless 10-bit intermediate (`ffv1`, `yuv444p10le`) with a frame-exact tail-into-head `xfade` for a loop (asserted to yield `N − fadeFrames` frames) or a passthrough for a play-once clip → grade at 16-bit with BT.709 stated explicitly (`colorbalance`, a `curves` highlight roll-off 1.0 → 0.84, and the black floor **lifted** to the page background `#0a0a0f`: the clip sits on the page at partial opacity and pixels darker than the page read as a dirty box) → `deband` → per-rendition crop window (`cropX`, a number or an ffmpeg expression of `t` with `D` = duration) and `lanczos` scale with error-diffusion dither to 8-bit → `libx264` High with an explicit level (`veryslow` alone lands at L5.1, which some phone decoders refuse), `keyint=infinite:scenecut=0` (one GOP, no keyframe pulse at the loop point), CFR, no audio, `+faststart`, metadata stripped → budget check → first-frame PNG beside each rendition. The ride and the loop share one grade, or the lattice nodes would change brightness at each handover. Added luma grain exists per clip but is off: it took a loop from 0.26 MB to 8 MB at CRF 16 and is quantized away at sane CRFs.

### Generation record (Higgsfield MCP)

**The flight (2026-09-22, shipped).** Frame: `gpt_image_2_5`, 16:9, 2k, medium, with the first world's frame as `image_references` and the prompt "Same world and composition as the reference but with NO clouds at all: clear night air. A wide cinematic high view over an endless dark plain covered by a precise architectural lattice of fine luminous blue light lines … receding to a distant horizon under a soft blue glow. Only a faint atmospheric haze in the far distance gives depth; no cloud layer, no mist, no fog near the camera. The structure and its glow are concentrated in the right half of the frame and along the bottom right. The left 45 percent of the frame is near-black, empty and quiet, reserved for a headline …" (three variants; the calmest, closest to the original composition, was chosen). Video: `seedance_2_5`, mode `omni_reference`, that frame as both `start_image` and `end_image`, 16:9, 1080p, 10 s, `bitrate_mode: high`, no audio (120 credits). Prompt: "One continuous, fast, exhilarating FPV drone shot over a vast blueprint lattice of blue light lines on a dark plain under a clear night sky, no clouds anywhere. From the high wide view, the camera suddenly launches forward and dives steeply down toward the glowing lattice, levels out and races at very high speed just above the lines of light, which streak past with motion blur, then banks, pulls up hard and climbs back, decelerating smoothly to return exactly to the original high wide view so the shot can loop seamlessly. The lattice itself stays fixed and glows with a constant, steady light throughout: no pulses, no flares, no flickering, no waves of light, no brightness changes. The left side of the frame stays dark at the start and the end. Dynamic, energetic, cinematic, strong sense of speed, deep navy and vivid electric blue light, volumetric glow and bloom. One unbroken shot, no cuts, no text, no people, no buildings, no clouds." Loop closure after the crossfade: SSIM 0.80 (the first frame is already the launch, so consecutive frames differ that much; the tail settles into the high view and blends into it over 0.8 s) (first vs last frame). Why: the owners loved the opening ride ("like we're running or flying") and found the clouds distracting. It looped for an afternoon; the same day the owner decided it should play once per visit and then hold, with the cube "sitting in the air, doing its thing".

**First version (2026-09-21, superseded 2026-09-22): the cloud sea, an opening ride and a locked-off loop.** Style frame (the world both clips started and ended on): `gpt_image_2_5`, 16:9, 2k, medium quality. Prompt: "Wide cinematic night view over a thin, drifting layer of cloud. Clearly visible beneath it on the right side of the frame: a precise architectural lattice of fine luminous blue light lines, an orthogonal grid with nested rectangles, connecting paths and small bright nodes at the intersections, like a systems blueprint laid out across a dark plain, seen in perspective and softened by the thin cloud passing over it. The structure and its glow are concentrated in the right half of the frame and along the bottom right. The left 45 percent of the frame is near-black, empty and quiet, reserved for a headline. Level horizon. Precise, engineered, calm, premium. Color palette strictly limited to near-black navy and one accent, electric blue #188CFF with pale blue #7EC1FF highlights. No other hues. Cinematic, volumetric light, soft atmospheric haze, fine film grain, deep blacks, photoreal 3D render quality. Absolutely no text, letters, numbers, logos, watermarks, UI, icons, people, hands, faces, buildings, skylines, stars, moon or planets."

Loop, the shipped one (steady lattice, 2026-09-22): `seedance_2_5`, mode `omni_reference`, the frame as both `start_image` and `end_image`, 16:9, 1080p, 10 s, `bitrate_mode: high`, no audio (120 credits). Prompt: "Locked-off static camera on a tripod, no camera movement at all. The blueprint lattice of blue light lines beneath the clouds stays perfectly fixed in place, keeps exactly the same shape throughout, and glows with a constant, steady light: no pulses, no flares, no flickering, no waves of light, no brightness changes anywhere on the lattice or its nodes. The only motion in the scene is the clouds, which roll and drift quickly from right to left, lit from beneath by the constant glow, thinning and thickening as they pass without ever fully covering the lattice. Vivid electric blue, deep navy, volumetric glow, high contrast, alive but calm beneath. The left side of the frame stays dark. The shot ends exactly as it began. No cuts, no text, no people, no buildings." Loop closure SSIM 0.976 (first vs last frame after the crossfade), ride-to-loop handoff SSIM 0.954. It replaced the first loop after the co-founders found its racing pulses distracting next to the tesseract.

Loop, superseded (pulsing, 2026-09-21): same settings (120 credits). Prompt: "Locked-off static camera on a tripod, no camera movement at all. The blueprint lattice of blue light lines stays perfectly fixed in place and keeps exactly the same shape throughout. The scene is full of energy: bright pulses of light race rapidly along the lattice lines in every direction like data traffic, nodes flare brightly in fast cascading sequences, and every few seconds a wave of light ripples outward across the whole grid from its center. The clouds roll and drift quickly from right to left, lit strongly from beneath by the surging glow, without ever fully covering the lattice. Vivid electric blue, strong glow and bloom, high contrast, dynamic and alive. The left side of the frame stays dark. The shot ends exactly as it began. No cuts, no text, no people, no buildings." The end came back near the start (SSIM 0.93, clouds differ), hence the crossfade; the lattice is fixed across the clip, so the fade cannot ghost it.

Ride: same model and settings. Prompt: "One continuous, fast, exhilarating FPV drone shot. From the high wide view, the camera suddenly launches forward and dives steeply down through the thin cloud layer toward the glowing blue blueprint lattice, then levels out and races at very high speed just above the lines of light, which streak past with motion blur while bright pulses of energy race along the lines alongside the camera and nodes flare brightly as it passes. Then the camera banks, pulls up hard and climbs back up through the clouds, decelerating smoothly to return exactly to the original high wide view. Dynamic, energetic, cinematic, strong sense of speed, deep navy and vivid electric blue light, volumetric glow and bloom. One unbroken shot, no cuts, no text, no people, no buildings." It returns to its first frame (SSIM 0.976 first vs last) and that frame matches the loop's (SSIM 0.94), which is what makes both handovers invisible.

A calm first version (slow drift, faint pulses, heavy scrims) was built, approved at every gate from stills and comps, and rejected by the owner on seeing it move ("too conservative"). Judge motion by watching it, not from stills; get a real motion sample in front of the owner early.

### Verification recipe

`npm run build` and the em/en-dash gate; `ffprobe` on `dist/assets/*.mp4` (h264 High, yuv420p, no audio stream, `moov` before `mdat`); Playwright for the DOM checks (no `.mp4` request and no `src` under reduced motion; one rendition per viewport; offscreen pause and resume; the toggle by keyboard, persisted across reloads; the intro-to-loop handoff classes); the worst-case Lighthouse build (2026-09-21: mobile 99, desktop 100, accessibility / best practices / SEO 100, LCP element the still, TBT 0, CLS 0); contrast at the ride's brightest frame with a sharp-based sampler against real pixels (headline 7.3:1 median and 5.0:1 at the 95th percentile, subtitle 5.9 / 4.7; the outline CTA measured 3.7:1 and got its smoked-glass backing). Two tooling facts: the in-app browser pane, when hidden, freezes animations and reports no LCP, and the Playwright MCP page renders at about one frame per second here, so anything frame-based is checked in a visible page.

---

## Hero tesseract

The home hero's visual is a transparent four-dimensional cube of light with the logo lockup at its core, drawn live by `src/components/HeroTesseract.astro` (owner decision 2026-09-22; brand rules in `XTEND-AI-WEB.md` §4.1, §12.1a, §12.5). It replaced the phone mockup. Drawn on a `<canvas>` rather than shipped as video because the geometry must be exact, the rotation must run forever without a loop seam, the object must be truly transparent over the ambient clip, and it reacts to the visitor. Higgsfield supplied the look (style frames the canvas was calibrated to) and the energy-core glow stills behind the cage.

### Layers

Inside `.hero__visual` (which keeps the entrance `rise`; two transform animations on one element fight), `.tess` reserves a square box (`width: var(--cube-size)`, `aspect-ratio: 1`, `pointer-events: none`) and holds `.tess__float` (the CSS float) with, back to front: `.tess__backing` (a faint CSS radial glow of `--xt-accent`, a contrast plate more than a halo since 2026-09-22), optionally two core stills (`coreA` / `coreB` props; RGBA `<Image>`s, normal blending, counter-rotating and breathing in CSS; **not shipped**, see below), the canvas, and the DOM lockup (mark over wordmark), which is the no-JS fallback and the bitmap source and is hidden (`.has-logo`) once the canvas draws it. Every CSS loop is gated on `.is-live`, so without JavaScript the visitor gets a static glowing core and the lockup and nothing that would need a pause control. No `mix-blend-mode` anywhere: isolated, a blend mode blends against an empty backdrop; un-isolated it makes the compositor read back the video layer.

### Geometry and motion

Sixteen vertices `(±1, ±1, ±1, ±1)`, 32 edges (index pairs differing in one bit), 24 faces (an axis pair × the four settings of the other two bits), an adjacency table for pulses. Per vertex, in order: XW rotation by `a` (the inside-out turn), a small ZW oscillation (`±0.3 rad`, period 37 s), 4D→3D perspective `s = d4/(d4 − w)` with `d4 = 2.4` (the inner cube is 41% of the outer at rest), yaw about Y (`x' = x cos φ + z sin φ`; a positive rate moves the front face to the right, "left to right"; a negative `--cube-yaw-period` reverses it), tilt of 18° about X (shows the top face), then 3D→2D `f = d3/(d3 − z)` with `d3 = 14`. Cruise: yaw 14 s per turn, XW 22 s (the swell repeats every 5.5 s by symmetry), float 6 s.

**Sizing so nothing ever clips:** every vertex has 4-D norm 2, so the projected radius is `ρ(w) = d4·√(4 − w²)/(d4 − w)`, largest at `w = min(w_max, 4/d4)`; with the ZW amplitude `w_max = sin A + √2 cos A = 1.65` and `ρ_max = 3.62` (the outer cube swells about 22% during the turn). A sphere of radius `ρ` seen from `d3` has screen radius `ρ·d3/√(d3² − ρ²)`, so the scale is `S = (H − m)·√(d3² − ρ_max²)/(d3·ρ_max)` with `H` half the box and `m` a 6% bloom margin.

### Rendering (per frame, no allocations)

1. Faces: 24 additive quads (`globalCompositeOperation: 'lighter'`) at `--cube-face-alpha` × how much the quad faces the camera (shoelace area), the "glass" tint; order-independent because additive.
2. Bloom: the cage is drawn at 1/4, 1/8, 1/16 and 1/32 size on offscreen canvases and each is drawn back at full size; bilinear upscaling is the blur. Edges go to every octave; vertex points and pulses only to the 1/4 and 1/8 ones (a dot in a coarse octave blooms into a ball: the "fireballs" the owner asked to remove).
3. The far half of the crisp edges (sorted far to near by a counting sort into 8 depth bins), shaded by nearness (alpha 0.35..1, width 1.1..1.9 px × `size/435`, accent for far, accent-light for mid, a pale cyan-white for near).
4. The lockup: one `drawImage` of a bitmap pre-scaled at resize time (stepwise halving of the DOM images; a 4× direct downscale of the 744 px wordmark shimmers), on a radial dark pocket of `--xt-bg-primary` (`--cube-logo-plate`).
5. The near half of the edges and the vertex points, then pulses (off by default) and embers (drifting particles, 1/8 octave + crisp).

Colours are the tokens, read once from `:root` (`--xt-accent`, `--xt-accent-light`, `--xt-text-primary`, `--xt-bg-primary`) and cached as strings; per-edge variation is `globalAlpha` only. DPR is capped at 2 (1.5 in tier 1, 1 in tier 0) and the backing store at 1024 device px per side (iOS canvas memory), so a 544 px box runs at DPR 1.88. Measured cost on the development machine: no dropped frames at 120 Hz. The worst-case Lighthouse build (`AMBIENT_DELAY_MS=0`) measured 98 mobile / 100 desktop on 2026-09-22 with the still as the LCP element and CLS 0; the canvas adds about 40 ms of Total Blocking Time under Lighthouse's 4× CPU throttle (the bitmap build and first frames).

### Entrance, reactions, guards

- **Assembly** follows the `rise` CSSAnimation on `.hero__visual` (found with `getAnimations()`, present by `DOMContentLoaded`): every frame the elapsed time is `currentTime − delay`, so the cage cannot run ahead of the column's fade-in; after the animation finishes the clock advances by `dt`. Edges draw in centre-outward (each 450 ms, staggered), points appear as edges reach them, the lockup fades and scales in over 300-1400 ms, the rotation eases up over 2.4 s with the inside-out turn starting at 2× speed. Fallbacks: `animationstart` filtered on the rise and the parent, then a 3 s timer; a late script skips the fade so the visible DOM lockup does not blink.
- **Pointer** (`(pointer: fine)` only): one passive `pointermove` on the hero section with the centre cached (≤ 4 reads of `getBoundingClientRect` per second); tilt targets ±10°, a proximity surge that raises the inside-out rate (`--cube-hover-boost`) and glow; lerped with `1 − exp(−dt/τ)`. **Scroll**: extra yaw per scrolled pixel, decaying. **Click** inside the cube: a flash.
- **Guards**: reduced motion and `deviceMemory ≤ 2` draw one static frame in the hero pose and never start the loop (Save-Data and 2g/3g stop only the video: the first production build froze the cube under Android Data Saver too and the owners reported the page as "hanging"; the toggle's resume path now treats motion sources separately from clips); `data-ambient-off` (read from the attribute and `localStorage['xt-ambient']` at boot, then a `MutationObserver` on `<html>`) freezes the frame and pauses the CSS loops; the loop stops off screen (IntersectionObserver, threshold 0) and in hidden tabs, resumes after a bfcache restore. Adaptive tier: 2 → 1 → 0 when more than 15% of frame intervals exceed 34 ms over a rolling 3 s window (tier 1 drops the fine octaves and faces; tier 0 is a crisp pass at DPR 1 and 30 fps); 30 fps after a minute without interaction.
- **Pause-control contract** (shared with `AmbientVideo.astro`): the root carries `data-motion` while it can animate and `data-motion-playing` while it does, and dispatches `xt-motion` on `document` at each change; `AmbientVideo`'s `paint()` counts both for the toggle's visible and resumable states. State lives in the DOM, so script order cannot matter. The toggle wiring still lives in AmbientVideo's guarded block, so on a page without an ambient box the cube would have no pause control (true nowhere today).
- A read-only hook `host.tess = { state, project }` exists for verification (yaw, tier, running, front vertex x).

### Knobs (custom properties on `.hero`, inherited; defaults in the component)

| Knob | Shipped | Meaning |
|---|---|---|
| `--cube-size` | `min(90vw, 400px)`; ≥ 1024: `clamp(375px, 42.5vw, 625px)` | box width; fills the 544 px column from 1280 (a quarter larger than first built, owner request) |
| `--cube-logo`, `--cube-logo-plate` | 0.34, 0.3 | lockup width as a fraction of the box; strength of the dark pocket behind it |
| `--cube-yaw-period`, `--cube-4d-period` | 14s, 22s | one turn left to right; one inside-out cycle |
| `--cube-zw-period`, `--cube-zw-amp`, `--cube-tilt` | 37s, 0.3, 18deg | the gentle second wobble; camera tilt |
| `--cube-4d-depth`, `--cube-perspective` | 2.4, 14 | nesting contrast; 3-D perspective |
| `--cube-glow`, `--cube-face-alpha`, `--cube-backing`, `--cube-core-opacity` | 1, 0.03, 0.2, (unused) | bloom, glass tint, CSS haze, core stills (none shipped) |
| `--cube-pulses`, `--cube-embers` | 0, 24 | travelling pulses (off: their heads read as fireballs); drifting particles |
| `--cube-hover-boost`, `--cube-scroll-spin`, `--cube-entrance`, `--cube-float-period`, `--cube-core-period` | 1.6, 0.002, 2000ms, 6s, 40s | reactions and timings |

Presets to offer when the owner asks for more or less: **Present** (yaw 18s, 4d 28s, glow 0.85, backing 0.28, core 0.7, embers 16, hover 1.4, scroll 0.0015), **Bold** (the shipped values), **Statement** (yaw 10s, 4d 16s, glow 1.3, backing 0.45, core 1, embers 36, hover 2, scroll 0.003).

### Calibration and generation record (Higgsfield MCP, 2026-09-22)

Six style frames (`gpt_image_2_5`, 1:1, 2k, medium, 1.5 credits each) in two looks, "Blueprint in light" (thin precise lines, small nodes, quiet core) and "Energy lattice" (luminous beams, bloom, plasma core); the owner chose the Energy family and frame 5 (a nebula-ring core that stays calmer in the middle, where the lockup sits) was measured for calibration: crisp core about 1.2% of the cube's extent with a pale cyan-white peak, half-max at a deep saturated blue, the visible halo about 6.5% of the extent, bright nodes, a wide dark-blue haze around the object. The shared prompt described the object exactly ("a smaller cube nested inside a larger cube, each of the eight corners of the inner cube joined to the matching corner of the outer cube by a straight edge, 32 edges in total … floating centered in an empty pure black void, three-quarter view slightly from above … palette strictly near-black plus electric blue #188CFF with pale blue #7EC1FF highlights … no text, letters, numbers, logos, watermarks, UI, people, hands or background objects").

Energy core: three candidates (`gpt_image_2_5`, 1:1, 2k, medium, `background: transparent`, two with frame 5 as `image_references`): "Only the glowing energy core from the reference, isolated: a soft spherical cloud of electric-blue plasma light with wispy filaments, brightest in a glowing ring around a calmer, darker middle, fading smoothly to fully transparent well before the edges of the square … no cube, no straight lines …". Two were kept (a soft nebula, a finer-filament swirl) and shipped for a day behind the cage. They came back with a transparent margin but an opaque dark disc under the glow, so a keying script (coverage = brightness, colour unpremultiplied but never amplified beyond about 3×, forced blue-dominant, coverage under 5% dropped, a radial vignette to zero alpha) turned them into light. **Removed on 2026-09-22 at the owner's request** ("the energy field around the logo, I need that gone"), together with the script and the assets; commit `55f7cd3` and its parents hold them if the idea returns. The `coreA` / `coreB` props stay in the component. Job ids live in the gitignored `video-masters/manifest.json` (the repo is public).

### Verification recipe

`npm run build`; then in a **visible** page (the Playwright MCP page renders at about one frame per second here, so it is used only for logic; the in-app pane runs at 120 Hz when its page reports `visibilityState: visible`): rAF interval sampling for dropped frames, the entrance at 1.3 / 3.5 / 9 s, pointer tilt and scroll spin. In Playwright: `host.tess.state` twice for direction (yaw rising, the front vertex's x rising), the toggle (freeze: `toDataURL()` unchanged 2 s apart, `data-motion-playing` gone, `.tess__float` animation `paused`, `localStorage['xt-ambient'] === 'off'`, persists across reload; resume), reduced motion (`emulateMedia`; no `data-motion`, canvas painted, no video `src`, zero `.mp4` requests, snapshot unchanged), the cube-only case (an init script that rejects `HTMLMediaElement.prototype.play` with `NotAllowedError`: the toggle still appears and works), `pageerror` / console errors, a `layout-shift` observer (CLS 0 at 1920, 1280 and 375). On a real device, append `?diag` to the URL: a panel lists the signals the motion decisions depend on (Save-Data, effective connection type, device memory, reduced motion), the clip and cube state, and any script errors captured from the very start. Then the worst-case Lighthouse build. Run it as `npx lighthouse@13.4.1`: that exact spec is in the npx cache since 2026-09-22, while an unpinned `npx lighthouse` fetches whatever release is newest (it pulled 13.5.0 that day). Results are comparable across those two versions (99 / 100 with 13.5.0).

---

---

## Deployment Quirks

### Build output location

`astro.config.mjs` sets `build.assets: 'assets'`, overriding Astro's default of `_astro`. Optimized image variants land in `dist/assets/` — not `dist/_astro/`. When verifying the image pipeline, look in `dist/assets/` for files matching `my-ai-bartender-icon.*.webp`.

### CI triggers on any push to `main`

The GH Action at `.github/workflows/azure-static-web-apps.yml` fires on every push to `main`. A doc-only change still triggers a full build + redeploy (~1 min) that produces an identical site. The cost is acceptable and the alternative (path-filtered triggers) would risk missing edge cases.

### Direct-to-main push guard (Claude Code)

Pushes to `main` are gated by a permission guard in the local Claude Code harness. When running under auto mode, the guard may block direct pushes even with prior authorization. Workaround: the user runs `! git push origin main` from the prompt, which executes the push in their local session.

### Redirects only exist in production

`/products` 301-redirects to `/work` via the `routes` array in `staticwebapp.config.json`. SWA config is not interpreted by `npm run dev` or `npm run preview`, so locally `/products` 404s (dev) or falls through to `navigationFallback` (deployed behavior for unknown routes). The redirect deliberately does **not** use `/products/*` — that would swallow the live detail pages, and `/products/my-ai-bartender` is linked from both app-store listings.

Two hard-won rules about that config:

- **SWA normalizes trailing slashes.** `/products` and `/products/` are the *same route*; listing both is a duplicate-rule validation error. And it is not a warning — it kills the deploy.
- **`staticwebapp.config.json` is validated only in the deploy pipeline.** `npm run build` — the repo's only local gate — passes happily over a config that will fail deployment. The Oryx build succeeds, then the deploy step validates the config and exits. If a push "succeeded" but production still serves old content, check the GitHub Action's conclusion before anything else (this exact sequence happened on 2026-07-24).

### Domains

- `https://www.xtend-ai.com` — custom domain (use for shares/links)
- `https://gentle-sea-0d684ea10.2.azurestaticapps.net` — Azure SWA hostname (use for cache-bust diagnostics during deploys)

Both resolve to the same deployment; each deploy updates both simultaneously.

### Video assets

`.mp4` renditions are imported from `src/assets/video/`, so Vite emits them content-hashed under `/assets/` and a missing clip fails the build. `staticwebapp.config.json` maps `.mp4` to `video/mp4` and gives `/assets/*.mp4` `Cache-Control: public, max-age=31536000, immutable`; the hash in the filename is the cache-buster. After a deploy: `curl -I` a clip for `200`, `video/mp4` and the immutable header; a `Range: bytes=0-1` request for `206` (iOS will not play without range support); a missing `.mp4` for `404`. The config is validated only by the deploy pipeline (see *Redirects only exist in production*), so a config change should first go through a pull request: the workflow builds PR staging environments, and since commit `48e8602` it has the `permissions` block (`contents: read`, `issues: write`, `pull-requests: write`) the bot needs to post the staging URL under the repo's read-only default token.

---

## Known Gotchas

### 1. Emoji color cannot be set via CSS

Emoji glyphs (`👤`, `🍸`, etc.) are rendered by the OS font stack with their own color tables. `color:` and `filter:` do not reliably recolor them. When an icon needs a specific color, use a `currentColor` SVG glyph from `Icon.astro` (see *Stroke icon glyphs* in the Icon Placement Map). As of 2026-07-25 the site contains no emoji at all — keep it that way.

### 2. `--xt-coral` is pink, not coral

`--xt-coral: #f472b6` is actually pink. Not worth renaming (breaking change across several call sites), but be aware when reasoning about the palette.

### 3. Legacy `--xt-blue-600` was previously purple

Before the brand palette was implemented, `--xt-blue-600` held `#8b5cf6` (a purple inherited from the My AI Bartender app's Tailwind-ish naming). It's now `#188CFF`, matching what its name suggests. References in old git history or superseded screenshots may show the prior purple value.

### 4. `rgba()` with CSS custom properties

CSS custom properties can't be directly interpolated into `rgba()` literals without `color-mix()` or a helper. This is why the codebase uses hardcoded `rgba(24, 140, 255, X)` instead of `rgba(var(--xt-accent), X)`. A future refactor could introduce `--xt-accent-rgb: 24, 140, 255;` and use `rgba(var(--xt-accent-rgb), X)` — not done now because it would touch 30+ call sites.

### 5. `hero__phone-img` fallback mechanism — REMOVED 2026-07-24

The home hero previously rendered `<img src="/images/app-preview.png" onerror="this.style.display='none'">` above the CSS phone mock. The file never existed, so every production page load logged a console 404, and the mechanism was a trap: dropping a real file at that path would have silently replaced the entire CSS phone mock. The `<img>` was removed 2026-07-24, and on 2026-07-25 the mock itself was replaced by a real screen capture (see *Hero phone screenshot* in the Icon Placement Map) — the deliberate replacement this note used to ask for.

### 6. No linting or formatting in CI

The repo doesn't run ESLint, Prettier, or `astro check` in CI. When editing files on Windows, be careful not to introduce line-ending churn — Git is configured to convert LF ↔ CRLF, which can show up as noise in diffs.

### 7. Untracked reference PNGs in repo root

The repo root contains several untracked screenshot PNGs (`color01.png`, `old01.png`, `icon01.png`, etc.) that the product owner drops in as reference material during planning, plus the `CLIQUE_Pix/` folder of source brand assets. They are not site assets and should not be committed. Anything the site actually renders gets copied into `src/assets/` first (as `clique-pix-icon.png` was). Git status will keep flagging the rest as untracked until explicitly gitignored or removed.

### 8. `backdrop-filter` creates a containing block for fixed-position descendants

Several CSS properties — `filter`, `transform`, `perspective`, `backdrop-filter`, `will-change`, and `contain` — make an element behave as the **containing block** for any `position: fixed` descendants, overriding the usual viewport-relative resolution. A fixed-positioned child of such an element anchors to the parent's box, not the viewport.

This bit the mobile menu. `.header` has `backdrop-filter: blur(20px)` (Header.astro:103) for its glass look. Originally `.mobile-menu` was nested inside `<header>`, so its `position: fixed; top: var(--header-height); bottom: 0` coordinates resolved against the header box instead of the viewport (the header was 72 px tall at the time; the math below uses that value):

```
top:    72 px from the top of the 72 px header     = y=72 in viewport
bottom:  0 px from the bottom of the 72 px header  = y=72 in viewport
height: 72 - 72 - 0 = 0 px
```

The menu was rendering at zero pixels tall on mobile, which is why tapping the hamburger produced the X animation and scroll lock but no visible nav items. Fix was to move `.mobile-menu` to be a DOM sibling of `<header>` (commit `3d507d2`) so it resolves against the viewport.

**Rule of thumb**: any fixed-position overlay intended to cover the viewport — dialogs, drawers, modals, toasts — must be a DOM sibling of `<header>` (or live at body-root level), never a descendant. The header's `backdrop-filter` is permanent, so anything nested inside will inherit the containing-block trap.

A second rule rides along: the closed menu is `aria-hidden="true"` **and** `visibility: hidden`. The visibility is not decoration — an aria-hidden container must not hold focusable content, and without it keyboard focus tabs into the invisible menu. The delayed `visibility` transition (`0s linear var(--transition-base)`) exists so the slide-out animation finishes before the menu vanishes; the open state restores instant visibility. Any future overlay needs the same pairing.

### 9. The contact-form interest list lives in two files

The interest selector's option strings exist in `src/pages/contact.astro` (the `interests` array that renders the `<select>`) and in `api/contact/index.js` (the `INTERESTS` allow-list). They must stay in step. The Function puts a value into the email subject **only if it is on the allow-list**; anything else falls back to the generic subject. That one rule covers a stale cached page (no `interest` field), a malformed payload, and header-injection attempts — but it also means a new option added to the page and not the Function silently never reaches the subject line.

### 10. Decorative video: three rules that are easy to break

A `<video>` never carries `autoplay`, `src` or `poster` in the markup (the script decides whether it may load at all); a full-bleed clip sits over its own first-frame still so the still, not the video, is the LCP element; and a component that layers z-indexed children needs `isolation: isolate` or its scrim ends up above the page content. A future Content-Security-Policy needs `media-src 'self'`. Details in *Ambient video*.

### 11. Canvas bitmaps built before layout

`HeroTesseract.astro` pre-scales the lockup by halving the DOM images step by step. Built before the first resize (an image can finish loading first) the target size is 0, and an unbounded `while (w / 2 >= target)` never ends: the page's main thread was blocked, and both test browsers had to be killed (`page.goto` cannot recover a renderer that never yields). Guard bitmap builds on a known size and bound every halving loop on the source size too.

### 12. The `animation` shorthand resets `animation-play-state`

A pause rule (`html[data-ambient-off] … { animation-play-state: paused }`) loses to any later or more specific rule that sets the `animation` shorthand, because the shorthand resets play-state to `running`. Give the pause rule higher specificity than the rule that starts the animation (the tesseract's pause rule targets `.tess.is-live .tess__float`, the same selector depth as the rule it must beat, plus the `html` attribute).

---

## History notes

Significant implementation decisions captured here for future reference:

- **Palette migration (commit `7496b59`)** — Site-wide swap from inherited My AI Bartender purple (`#8b5cf6` + variants) to the Xtend-AI brand blues (`#022A56` + `#188CFF`). Introduced `--xt-accent`, `--xt-accent-light`, `--xt-navy`, `--xt-navy-deep`, `--xt-link`, and `--xt-gradient-accent-text`. Renamed `--xt-gradient-purple` → `--xt-gradient-brand`. Renamed CSS class modifiers from `--purple` to `--accent` across templates.
- **App icon integration (commits `0ec296f`, `b1526d9`, `8e1cf8c`)** — Introduced `src/assets/` as the canonical location for `<Image>`-processed images, starting with `my-ai-bartender-icon.png`. First use of `astro:assets` in the codebase.
- **Profile avatar SVG conversion (commit `a452b4c`)** — Replaced `👤` emoji with an inline SVG person silhouette on a solid green disc, because emoji colors can't be controlled via CSS.
- **Home Featured Product icon (commit `c594f19`)** — Added a 96 × 96 `<Image>` between the H2 and tagline in the home-page Featured Product section. 4th site-wide placement of the app icon; lazy-loaded since below the fold.
- **Mobile menu containing-block fix (commit `3d507d2`)** — Moved `.mobile-menu` out of `<header>` so its fixed-position coordinates resolve against the viewport. The menu was previously zero-height on mobile because the header's `backdrop-filter` made it the containing block for descendant fixed elements. See Known Gotchas #8.
- **Services repositioning (2026-07-24, commits `a86791f`…)** — The company now also builds websites and web applications for clients, and the site was restructured services-first around a rewritten `XTEND-AI-WEB.md`. New: `/services`, `/work`, `/products/clique-pix`, `StoreLinks.astro`, contact interest selector wired through the Azure Function, Organization + ProfessionalService JSON-LD. Removed: `/products` index (301 → `/work` — the listing and `/work` would have described the same two apps and drifted). Nav became Home / Services / Work / About / Contact with Support footer-only. Detail-page URLs were preserved because both live app-store listings link `/products/my-ai-bartender`.
- **FeatureCard token fix (commit `3412465`)** — `FeatureCard.astro` was unused and unusable: its text colors were `var(--xt-navy-900)`, a legacy alias that *sounds* like light-theme text ink and genuinely is `#022A56` in the colliding `xtend-ai_brand_tokens.css`, but resolves to background `#12121a` in this site's `global.css` — near-black on near-black. Repointed to semantic tokens, which survive a theme inversion; numbered-scale names don't. This is the token-collision warning above, observed in the wild.
- **Lighthouse hardening (2026-07-24)** — Mobile Performance was 71 (home) / 73 (services); all four categories are now 100 on both pages, mobile and desktop. Two causes, found by the observed-vs-simulated LCP gap: the Google Fonts chain (fixed by self-hosting two variable woff2 files — see Fonts) and the header logo, a 775 KB PNG served raw from `public/` and rendered 48 px square — simulated 5.4 s LCP on slow 4G (fixed via `<Image>`, 99.7% smaller). Also fixed: `--xt-text-muted` contrast (AA), focusable links inside the closed aria-hidden mobile menu, and the hero's guaranteed console 404 (gotcha #5, now removed).
- **Reverse logo lockup + hero watermark (2026-07-24, commits `ec16277`…)** — The header logo was an opaque 1024² PNG ("white" = its background) rendered as an illegible 48 px white chip on the dark bar; no dark-surface logo variant existed anywhere. Added `scripts/make-reverse-logo.mjs` (see Icon Placement Map) generating the reverse mark and white wordmark from the transparent brand PNGs, rebuilt the header/footer as mark + readable wordmark + stacked tagline, deleted the chip asset, and added a 6% opacity X watermark behind the home hero (≥ 768px only, lazy — never fetched on mobile). Brand rule recorded in `XTEND-AI-WEB.md` §12: on dark surfaces navy ink inverts to white, `#188CFF` stays constant.
- **Reverse favicons + OG card (2026-07-24, commits `96dfd18`…)** — The favicon was the navy-ink mark on transparency (its dark stroke vanished in dark browser tabs) and the default `og:image` was a transparent navy-ink PNG (invisible in dark-mode chat apps). `scripts/make-favicon-og.mjs` regenerates the favicon bundle as the reverse mark on a navy tile and builds the 1200×630 dark OG card now defaulted in `BaseLayout.astro`. The Organization JSON-LD logo deliberately keeps the transparent original for Google's light surfaces.
- **Site-wide letterhead watermark (2026-07-24, commit `3adcbca`)** — Owner request: the hero watermark, much bigger, centered, on every page, phones included. Now a fixed X at ~90% of the viewport in `BaseLayout.astro` that all content scrolls over. Key layering fact: the site's section backgrounds are opaque, so a watermark truly *behind* content would vanish for whole scroll stretches — instead it sits at z-index 90 (above section backgrounds, below header/menu/skip-link), which at 6% on a no-dark-text site renders identically to being behind. Superseded and removed the hero-only watermark from `index.astro`. New softened 1024px asset (`makeWatermark()` in the script) because the raw mark stair-stepped at viewport scale.
- **Design-taste audit, Phase 1 (2026-07-25, commits `bc082eb`…)** — The site was audited against the owner's design-taste skill and the code-only findings fixed in five commits, owner-approved plan. Accessibility: a blanket `prefers-reduced-motion` block (the site had none while running an infinite hero float), `100dvh` hero min-height, and the brand button gradient re-ended on `--xt-link` for AA text contrast. AI-tell removal: all 17 emoji icon sites replaced by `Icon.astro` (vendored Tabler stroke glyphs, contrast-driven per-fill stroke colors); the div-built fake phone UI replaced with a real Play-listing screen capture; section/footer/button glows removed (hero, page-header, and CTA-card glows kept); ten decorative eyebrow badges culled (semantic status badges kept); gradient headline text rationed to h1s; the home differentiators rebuilt as editorial rows because their three-equal-cards grid duplicated the services grid above. Dead tokens/keyframes deleted. **Deliberately untouched:** all copy (deferred to Phase 2, below) and the letterhead watermark (owner invariant). Brand rules recorded in `XTEND-AI-WEB.md` §12.5.
- **Design-taste audit, Phase 2 (2026-07-25, commits `00d06c5`, `a0f86bf`)** — The brief-synced copy pass. Every em- and en-dash was removed from visible copy, page titles, and meta descriptions (restructured with commas, periods, colons, parentheses — now a standing editorial rule in `XTEND-AI-WEB.md` §12.5, with a mechanical gate: zero `—`/`–` in `dist/**/*.html`). The hero subtitle was trimmed 33 → 23 words; the contact page's pre-brief filler subtitle was replaced with the closing-CTA promise; the services teaser button took the hero primary's label (one intent, one label); and the My AI Bartender closing CTA was rebuilt as the same business pivot as the CLIQUE Pix page, fixing a download-copy/contact-button intent mismatch. Every changed block was mirrored in `XTEND-AI-WEB.md` in the same commits.
- **Home hero entrance (2026-08-28)** — Linear-style load entrance on `/`: title → subtitle → CTAs → phone visual rise 56px from opacity 0, 2200 ms each at `cubic-bezier(0.25, 0.46, 0.45, 0.94)` (ease-out quad) with a 320 ms stagger (settled ~3.2 s), while `.hero__bg` blooms in opacity-only underneath over 2.6 s. The `rise` keyframes complete opacity at the 60% keyframe while the translate runs the full duration, so each element is fully visible during the tail of its travel — that visible glide is what makes it read as "rolling up" instead of fading in. Retuned three times the same day from 600 ms / 90 ms / 20 px on an expo-out curve: the owner found each pass too quick ("flash in, not roll up") — the qualitative fix was distance and the 60% opacity keyframe; the pace landed at owner-picked presets. The pace knobs are the `--rise-*` custom properties on `.hero`; **the cred bar's scroll reveal is deliberately pinned faster, at 1400 ms / 220 ms / 40 px, by an override on `.cred-bar`** — a ~3 s reveal during active scrolling reads as broken, not luxurious. Pure CSS in `index.astro`'s scoped block; the rise sits on `.hero__visual`, not `.hero__phone`, whose `transform` is owned by the infinite float loop (two animations on one element fight over `transform`). `animation-fill-mode: both` is the *only* thing hiding content — no static `opacity: 0` in the load sequence — so a no-animation environment sees the page fully rendered. The global reduced-motion block gained `animation-delay: 0.01ms !important` (previously only `transition-delay` was zeroed) so the stagger cannot hold content invisible. The credibility bar, always below the 100dvh hero fold, instead reveals on scroll: a small IntersectionObserver in `index.astro` adds `is-pending` (hides) then `is-revealed` (staggers the four `.cred` items in) on the grid — it arms the hidden state only when it can also reveal it, so no-JS and reduced-motion visitors just see the bar. Keyframe names (`rise`, `bloom`) are global in Astro output; `float` was the only pre-existing keyframes in `src`. Motion rule recorded in `XTEND-AI-WEB.md` §12.5.
- **Banner header (2026-08-28)** — Co-founder request: a bigger, wider header, escalated once more the same day. The bar grew from a fixed 72 px to a responsive token: `--header-height` is 96 px base and 132 px from 900 px (the desktop-nav breakpoint), redefined on `:root` inside a media query so every consumer follows automatically (bar height, `body` padding-top, `html` scroll-padding-top, mobile-menu top offset, and the hero's `min-height: calc(100dvh - var(--header-height))`). Header content also spreads wider than page content: `--header-max-width: 1440px` token consumed by `.header__container`, whose scoped rule out-specifies `.container`'s 1200 px cap. Lockup scaled to match (mark 56/72 px, wordmark 27/32 px, tagline 0.75/0.95/1.1 rem across the existing breakpoints — re-verified single-line at 375 px), and the two `<Image>` intrinsic widths bumped (mark 78, wordmark 176) so the 1x variants match the new render sizes. Nav links are 1.125 rem, stepping to 1.25 rem only from 1100 px: in the 900-1100 px band the 72 px mark + lockup + five 20 px links would collide. Width exception recorded in `XTEND-AI-WEB.md` §12.3. The bar never condenses on scroll (owner decision).
- **Ambient hero video (2026-09-21 / 22, commits `48e8602` … `ecf2bc7`)** — The owner asked for a "dynamic and eye-catching" site built with AI video (Higgsfield). Concept chosen from style frames: "The cloud beneath", a night cloud sea over a blueprint lattice of light, the tagline made visible. A calm first build (slow drift, faint pulses, heavy scrims) passed every gate and was rejected on sight as too conservative, so the hero became an opening FPV "ride" that plays once per session and hands off, seamlessly, to an energetic loop with the light running under the headline (dark plate, layered text halos and a smoked-glass outline CTA, all measured for contrast). New: `AmbientVideo.astro`, `AmbientToggle.astro` (WCAG 2.2.2 pause, site-wide, mirrored as `data-ambient-off` on `<html>`), `scripts/make-ambient-video.mjs` (ffmpeg: frame-exact crossfade loop, 16-bit grade with the black floor lifted to the page background, deband and dither, x264 with explicit levels, hard byte budgets), `src/assets/video/` (four renditions and two first-frame stills), SWA MIME type and immutable route for `.mp4`, workflow `permissions` for PR staging comments, `.gitattributes` marking `.mp4` binary, `video-masters/` gitignored, `.claude/launch.json` for the preview server, two `player-*` glyphs in `Icon.astro` copied from the Tabler v3.34.0 tag. The decision that shaped the component: video is never first paint, and the clip's own first frame is painted as a `<picture>` still at full strength so the still is the LCP element (Chrome otherwise registers the faded-in video as a late LCP; measured). Worst-case Lighthouse (`AMBIENT_DELAY_MS=0`): mobile 99, desktop 100. Brand rules recorded in `XTEND-AI-WEB.md` §4.1, §12.5, §13, §14.2. See *Ambient video* above.
- **Hero tesseract (2026-09-22, commits `9d66c42` … )** — The owner asked for the floating phone to become "a floating transparent 4-D cube, drawn in the same electric blue, with the Xtend-AI logo in the middle, rotating left to right", built with Higgsfield. Decided as a hybrid: the geometry is drawn live on a canvas (exact, seamless forever, truly transparent over the clip, reactive, a few KB), Higgsfield made the look (six style frames; the owner chose the Energy family, frame 5 was measured for calibration) and the energy-core stills behind the cage; the real reverse lockup (mark over wordmark, the owner's choice) sits at the core. New: `HeroTesseract.astro`, `scripts/make-tesseract-core.mjs`, `src/assets/hero/`, the `data-motion` / `xt-motion` pause-control contract in `AmbientVideo.astro`; gone: the phone markup, CSS, float keyframes, the screen capture and `--xt-phone-screen-bg`. Verified: direction, freeze/resume, reduced motion, the cube-only toggle, CLS 0, worst-case Lighthouse 98 mobile / 100 desktop. Two defects found and fixed in testing: an unbounded halving loop that froze the page when an image loaded before the first resize (gotcha 11), and the pause rule losing to the `animation` shorthand (gotcha 12). Co-founder feedback the same day: the bright pulse heads and blooming vertex dots ("white fireballs") were removed (pulses off, points only in the fine octaves), the cube grew 25% (fills the 544 px column), and the ambient loop was regenerated with a steady lattice because its racing light pulses distracted from the cube. Calm middle for the lockup comes from a dark pocket drawn under it, not from the stills. Brand rules rewritten in `XTEND-AI-WEB.md` §12.5.
- **Cloudless flight loop (2026-09-22)** — Owner request after the tesseract review: "get rid of the clouds, they seem a bit distracting" and "the beginning of the film, I love it, it's like we're running or flying, can we put that in a loop where it does that constantly". A cloudless frame was rendered from the first world's frame, and the ride was re-rendered from it as a loop (dive, race, climb back to the same view; steady lattice), so one clip now does what the ride-then-loop pair did. The page drops the `intro` props and the ride assets; `make-ambient-video.mjs` has a single `beneath-hero` clip with a 0.8 s closure fade and the travelling portrait crop. Sizes 2.88 / 1.18 MB against 3.5 / 1.5 MB budgets. The "cloud beneath" tagline is now carried by the lattice as the infrastructure beneath everything; brief §4.1 says so.
- **No energy core, slower flight (2026-09-22)** — Owner review of the flight build: the plasma "energy field" around the lockup had to go (the two core stills, their keying script and `src/assets/hero/` removed; the component keeps its optional `coreA` / `coreB` props; the CSS backing haze dropped to 0.2 so it reads as a contrast plate, not a field); the flight was "so fast it almost makes you dizzy", so the page plays it at `--ambient-video-rate: 0.7` rather than re-rendering (24 fps footage with motion blur tolerates the frame repeats; a slower re-render is the fallback if it judders on a real display). The "clouds" the owner saw were the previous build in a browser pane that had not been reloaded; the flight footage has none.
- **Half-speed flight, played once (2026-09-22)** — "The cube is great, can you slow the flight by about 50%?" then "I've decided to end the loop on the flight. Do it one time and then just have the cube sitting in the air, doing its thing." Half of the 0.7× the page already applied is 0.35×, too slow for playback rate alone (24 fps footage repeats frames visibly below about 0.6×), so the render was motion-interpolated to twice the frames (ffmpeg `minterpolate`, mci / aobmc / bidir) and re-timed to 24 fps, a true half-speed 20 s clip with clean mid-flight frames; the 0.7× knob stays on top. Then the loop went: `AmbientVideo` gained an optional loop (a box with only an opening clip plays it once per session and fades back to its first-frame still), the pipeline clip became play-once (`beneath-flight`, no closure fade, CRF 29 / 28, 3.98 / 1.73 MB against budgets raised to 4.5 / 2 MB), and the page passes the flight as `intro` only. The still under the clip is the flight's first frame, which is also where it ends, so the fade-out lands on the same view.
- **Production hotfix: the cube under Data Saver, and `?diag` (2026-09-22)** — First report from a founder's Samsung Z Fold 7 (Chrome): "it just hangs". The page had rendered and the cube had drawn, so the script had run; the likeliest cause was the cube copying the video's constrained-device predicate, which freezes it under Android Data Saver, a 3G-class connection estimate or Samsung's "Remove animations", leaving a hero where nothing moves. The cube now goes static only for reduced motion or `deviceMemory ≤ 2`; `AmbientVideo`'s toggle logic treats motion sources separately from clips for the resume path. `index.astro` gained a `?diag` panel (inline head listener for early errors, a small fixed panel rendered by the page script) so device reports come with facts.
- **Header tagline removed (2026-09-22)** — Owner request after the co-founders' review of the live hero: the "Web, mobile, and the cloud beneath" line under the wordmark made the header lockup look busy. The header is now mark beside wordmark; the wordmark grew from 27/32 px to 30/38 px so the pair stays balanced without the second line, and its `<Image>` intrinsic width moved to 210 so the 1x variant matches. The footer keeps the tagline as a wrapping line. The brief's §2 no longer lists the header as a placement and its 36-character nowrap ceiling is marked historical; §12.1a and §12.3 updated.
