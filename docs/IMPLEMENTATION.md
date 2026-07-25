# Implementation Notes

Practical reference for the Xtend-AI corporate site. `README.md` covers setup and deployment; this document covers **how things are organized inside the code** — design tokens, asset pipeline, Astro patterns, and common gotchas. `XTEND-AI-WEB.md` is the product brief (what the site is); this is the engineering companion (how it's built).

## Table of Contents

- [Design System](#design-system)
- [Asset Pipeline](#asset-pipeline)
- [Astro Patterns](#astro-patterns)
- [Icon Placement Map](#icon-placement-map)
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

`global.css` ends with a blanket `@media (prefers-reduced-motion: reduce)` block: every animation and transition collapses to 0.01 ms (duration **and** delay) and smooth scroll turns off. New animations are covered automatically — do not add per-component reduced-motion overrides. `transition-delay` is zeroed deliberately: the mobile menu delays its `visibility` flip by `--transition-base` so the slide-out animation stays visible, and with the slide collapsed the delay must collapse with it or the menu would hang open invisibly for 250 ms.

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
- Pre-optimized images that don't need Astro processing (e.g., `/images/cliquepix-logo.png`)

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

Tokens defined in `src/styles/global.css`'s `:root` block are accessible to every component. CSS custom properties defined in a component's scoped `<style>` block are scoped the same way selectors are, so if child components need to consume a value, define it globally.

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

Sources in `src/assets/`: `my-ai-bartender-icon.png`, `clique-pix-icon.png` (from `CLIQUE_Pix/play_app_icon_512x512.png`), `my-ai-bartender-screen.png` (500 × 837 — see *Hero phone screenshot* below), and the three **reverse logo assets** `xtend-ai-mark-reverse.png` (431 × 399), `xtend-ai-wordmark-white.png` (744 × 135), and `xtend-ai-mark-watermark.png` (1024 w — the mark upscaled and slightly blurred, because the 431px source's hard binary-alpha edges stair-step when CSS scales it to viewport size).

### Reverse logo assets

The brand PNGs in `public/images/` use navy ink drawn for white surfaces — invisible on this site's dark chrome. `scripts/make-reverse-logo.mjs` (run manually: `node scripts/make-reverse-logo.mjs`, then commit the outputs; sharp comes with Astro) generates the dark-surface variants:

- **Mark**: navy stroke → white, blue stays `#188CFF` (the `--xt-accent` value), blends interpolated on the green channel — the axis that separates the two inks. A near-white **fringe guard runs first**: the sources are background-removed rasters with binary alpha, and ~850 near-white leftover pixels would otherwise classify as "blue" and speckle the stroke edges.
- **Wordmark**: white ink with **alpha derived from pixel darkness**. The source's anti-aliasing is baked against white at full alpha; darkness-as-coverage converts it to true alpha anti-aliasing instead of hardening every edge to solid white.

A second script, `scripts/make-favicon-og.mjs` (run after the first — it reads the reverse assets), regenerates the brand images that leave the site: the favicon bundle in `public/` (reverse mark on a solid navy `#022A56` tile so it survives light *and* dark tab bars; `favicon.ico` is hand-built PNG-in-ICO at 16/32/48; the 180 apple-touch-icon is full-bleed because iOS applies its own mask) and `public/images/og-card.png`, the 1200×630 dark link-preview card that `BaseLayout.astro` uses as the `ogImage` default. Sharp quirk worth knowing in both scripts: `.composite()` always runs **after** `.resize()` in the libvips pipeline regardless of call order — composite and resize in separate sharp invocations when the order matters.

| Page | File | Image | Size | Treatment |
|---|---|---|---|---|
| Every page — header | `src/components/Header.astro` | mark + wordmark | 40/44 h + 20/22 h | reverse lockup, tagline stacked under wordmark, eager |
| Every page — footer | `src/components/Footer.astro` | mark + wordmark | 28 h + 18 h | reverse lockup, lazy |
| Every page — letterhead watermark | `src/layouts/BaseLayout.astro` | watermark | `min(90vw, 97vh)` | fixed + centered, all viewports; `.site-watermark` in global.css, opacity `--xt-watermark-opacity` (6%), z-index 90 (above opaque section backgrounds, below header 100 / menu 99 / skip-link 1000), srcset 512/1024 |
| Home — hero phone screen | `src/pages/index.astro` | `my-ai-bartender-screen.png` | 250 w | real home-screen capture inside the CSS phone frame, eager; frame bg `--xt-phone-screen-bg` continues the capture below its crop |
| Work — app cards | `src/pages/work.astro` | both apps | 72 × 72 | 22% squircle, soft drop shadow |
| Product detail — hero | `products/my-ai-bartender.astro` | bartender | 120 × 120 | 22% squircle, centered below H1 |
| Product detail — hero | `products/clique-pix.astro` | CLIQUE Pix | 120 × 120 | 22% squircle, centered below H1 |

All placements go through `<Image>` with `densities={[2, 3]}` (except the watermark — a 6% opacity ghost needs no retina variants — and the hero phone screen, whose 500px source caps it at `densities={[2]}`). Astro generates per-site size/density variants and deduplicates identical outputs.

### Hero phone screenshot

The home hero's phone frame renders a **real My AI Bartender home-screen capture** (`src/assets/my-ai-bartender-screen.png`), replacing a ~300-line div-built imitation removed in the 2026-07-25 audit. Provenance and the two constraints that shaped it:

- **Both store listings only publish marketing-framed renders** (blue background, caption, baked-in device) and every one of them **cuts the phone at the bottom edge** — a raw full-height capture does not exist in either listing (verified programmatically across all 7 App Store and 14 Play portrait images). The asset is the screen-glass interior cropped from the Play listing's "Premium Mixology Experience" render.
- The crop therefore **ends cleanly below the Recipe Vault card**, and the frame's background (`--xt-phone-screen-bg`, sampled from the capture's own page background) fills the remaining frame height, reading as the same screen's empty space. The frame's `border-radius: 28px` + `overflow: hidden` also clips the capture's rounded glass corners.

To refresh after an app redesign: pull the listing image (`https://play.google.com/store/apps/details?id=ai.mybartender.mybartenderai`, portrait image, `=h2400` size suffix), crop the screen interior, end at a clean card boundary, resize to 500 w, re-sample the page-background hex into `--xt-phone-screen-bg`.

### Stroke icon glyphs — `Icon.astro`

`src/components/Icon.astro` holds the site's icon dictionary: 18 outline glyphs **vendored from Tabler Icons v3.34.0 (MIT)** as inline SVG strings — 24 × 24, `stroke="currentColor"`, stroke-width 2, matching FeatureCard's larger hand-kept 48-grid set. No npm dependency; an unknown `name` **throws at build time** (pages are prerendered, so a typo fails `npm run build` instead of shipping a blank icon). Emoji are banned as icons (§12.5 of the brief): they can't take brand color (Known Gotcha #1) and they read as a second, unmatched icon language.

To add a glyph: download the outline SVG from the Tabler set, drop its `class` attribute and leading no-op bounding path, add `aria-hidden="true"`, paste as one line. **Scoping trap:** the SVG is emitted via `set:html`, so it carries no Astro scope attribute — page-scoped CSS must target it with `:global(svg)` (same mechanism as the `<Image>` rule above); the `width`/`height="24"` attributes on each glyph are the reliable default size.

> The letterhead watermark is the **LCP element on every viewport** (largest painted area beats the `<h1>` text block). Verified harmless 2026-07-24: ~49 KB WebP, paints ≈ 150–200 ms unthrottled; Lighthouse LCP 1.8 s mobile / 0.4 s desktop, all four categories 100 on both. If LCP ever regresses, look here first. In the header and footer the mark and wordmark are sized by **separate wrapper-scoped `:global(img)` selectors** — a shared `.header__logo :global(img)` rule would force both images to one height.

> The header logo previously shipped as a **775 KB PNG served raw from `public/images/`** — the site-wide mobile LCP element (simulated 5.4 s on slow 4G) — and then as a 1024² opaque "white chip" whose baked-in background made the lockup illegible at 48 px on the dark bar. If a redesigned logo asset arrives, it goes in `src/assets/`, never `public/`, and gets a reverse variant via the script above.

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

This bit the mobile menu. `.header` has `backdrop-filter: blur(20px)` (Header.astro:103) for its glass look. Originally `.mobile-menu` was nested inside `<header>`, so its `position: fixed; top: var(--header-height); bottom: 0` coordinates resolved against the 72 px header box instead of the viewport:

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
