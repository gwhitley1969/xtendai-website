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

These are **not** brand colors — they're illustrative chrome for feature cards and the home-page phone mock.

| Token | Value | Role |
|---|---|---|
| `--xt-blue` | `#3b82f6` | Secondary blue (feature icons, `hero__glow--2`) |
| `--xt-blue-light` | `#60a5fa` | Currently unused |
| `--xt-cyan` | `#22d3ee` | Feature icons, global link hover color |
| `--xt-coral` | `#f472b6` | **Misnamed — actually pink**; feature icons |
| `--xt-gold` | `#fbbf24` | Feature icons, gold badge accent |
| `--xt-green` | `#34d399` | Feature icons, profile avatar in the home-page phone mock |

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
| `--xt-gradient-brand` | `linear-gradient(135deg, #022A56 0%, #188CFF 100%)` | Primary CTAs, card washes, section accents |
| `--xt-gradient-accent-text` | `linear-gradient(135deg, #188CFF 0%, #7EC1FF 100%)` | Hero headline highlights via `.text-gradient` — brighter than the brand gradient so it reads as a shimmer on dark bg |
| `--xt-gradient-blue` | `linear-gradient(135deg, #022A56 0%, #188CFF 100%)` | Alias of brand gradient |
| `--xt-gradient-card` | `linear-gradient(145deg, rgba(24, 140, 255, 0.1) 0%, rgba(59, 130, 246, 0.05) 100%)` | `.card--glow` subtle background |
| `--xt-gradient-glow` | `radial-gradient(ellipse at 50% 0%, rgba(24, 140, 255, 0.15) 0%, transparent 70%)` | Section-glow washes (`.section--glow`) |
| `--xt-gradient-hero` | `linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%)` | Currently unused |
| `--xt-gradient-warm` | `linear-gradient(135deg, #f472b6 0%, #fbbf24 100%)` | Currently unused |

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

`:global()` opts the `img` selector out of scoping. Used at every `<Image>` call site — the header and footer logo, the home phone mock, the `/work` app cards, and both product detail heroes (see the Icon Placement Map).

### Scoped inline SVG — no `:global()` needed

When you inline an `<svg>` directly in a template rather than via a component, Astro scopes both the parent and child selectors normally. Example: the green profile-avatar SVG in the home phone mock uses `.phone-ui__header-profile svg { ... }` without `:global()`, and the compiled selector correctly matches the scoped attribute on both elements.

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

Sources in `src/assets/`: `my-ai-bartender-icon.png`, `clique-pix-icon.png` (from `CLIQUE_Pix/play_app_icon_512x512.png`), and the two **reverse logo assets** `xtend-ai-mark-reverse.png` (431 × 399) and `xtend-ai-wordmark-white.png` (744 × 135).

### Reverse logo assets

The brand PNGs in `public/images/` use navy ink drawn for white surfaces — invisible on this site's dark chrome. `scripts/make-reverse-logo.mjs` (run manually: `node scripts/make-reverse-logo.mjs`, then commit the outputs; sharp comes with Astro) generates the dark-surface variants:

- **Mark**: navy stroke → white, blue stays `#188CFF` (the `--xt-accent` value), blends interpolated on the green channel — the axis that separates the two inks. A near-white **fringe guard runs first**: the sources are background-removed rasters with binary alpha, and ~850 near-white leftover pixels would otherwise classify as "blue" and speckle the stroke edges.
- **Wordmark**: white ink with **alpha derived from pixel darkness**. The source's anti-aliasing is baked against white at full alpha; darkness-as-coverage converts it to true alpha anti-aliasing instead of hardening every edge to solid white.

| Page | File | Image | Size | Treatment |
|---|---|---|---|---|
| Every page — header | `src/components/Header.astro` | mark + wordmark | 40/44 h + 20/22 h | reverse lockup, tagline stacked under wordmark, eager |
| Every page — footer | `src/components/Footer.astro` | mark + wordmark | 28 h + 18 h | reverse lockup, lazy |
| Home — hero watermark | `src/pages/index.astro` | mark | 520 w | 6% opacity ghost in `.hero__bg`; `display: none` < 768px + lazy → never fetched on mobile |
| Home — phone mock header | `src/pages/index.astro` | bartender | 36 × 36 | 10 px `border-radius`, `overflow: hidden` clip |
| Work — app cards | `src/pages/work.astro` | both apps | 72 × 72 | 22% squircle, soft drop shadow |
| Product detail — hero | `products/my-ai-bartender.astro` | bartender | 120 × 120 | 22% squircle, centered below H1 |
| Product detail — hero | `products/clique-pix.astro` | CLIQUE Pix | 120 × 120 | 22% squircle, centered below H1 |

All placements go through `<Image>` with `densities={[2, 3]}` (except the watermark — a 6% opacity ghost needs no retina variants). Astro generates per-site size/density variants and deduplicates identical outputs. In the header and footer the mark and wordmark are sized by **separate wrapper-scoped `:global(img)` selectors** — a shared `.header__logo :global(img)` rule would force both images to one height.

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

Emoji glyphs (`👤`, `🍸`, etc.) are rendered by the OS font stack with their own color tables. `color:` and `filter:` do not reliably recolor them. When an icon needs a specific color, use inline SVG with `fill: currentColor` — see `.phone-ui__header-profile` for the pattern.

### 2. `--xt-coral` is pink, not coral

`--xt-coral: #f472b6` is actually pink. Not worth renaming (breaking change across several call sites), but be aware when reasoning about the palette.

### 3. Legacy `--xt-blue-600` was previously purple

Before the brand palette was implemented, `--xt-blue-600` held `#8b5cf6` (a purple inherited from the My AI Bartender app's Tailwind-ish naming). It's now `#188CFF`, matching what its name suggests. References in old git history or superseded screenshots may show the prior purple value.

### 4. `rgba()` with CSS custom properties

CSS custom properties can't be directly interpolated into `rgba()` literals without `color-mix()` or a helper. This is why the codebase uses hardcoded `rgba(24, 140, 255, X)` instead of `rgba(var(--xt-accent), X)`. A future refactor could introduce `--xt-accent-rgb: 24, 140, 255;` and use `rgba(var(--xt-accent-rgb), X)` — not done now because it would touch 30+ call sites.

### 5. `hero__phone-img` fallback mechanism — REMOVED 2026-07-24

The home hero previously rendered `<img src="/images/app-preview.png" onerror="this.style.display='none'">` above the CSS phone mock. The file never existed, so every production page load logged a console 404, and the mechanism was a trap: dropping a real file at that path would have silently replaced the entire CSS phone mock. The `<img>` is gone — the CSS mock **is** the hero visual. To use a real screenshot instead, replace the markup deliberately; there is no magic path anymore.

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
