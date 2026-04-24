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
| `--xt-text-muted` | `#71717a` | Placeholders, captions |

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

Astro deduplicates output files by size+hash, so identical variants across multiple import sites share one generated file. Confirmed during the products-listing icon addition: 72 px (1x on products listing) reused the 72 px variant that had been generated as 2x for the home-page icon.

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

`:global()` opts the `img` selector out of scoping. Used for all three app-icon call sites (home phone mock, product detail hero, products-listing card).

### Scoped inline SVG — no `:global()` needed

When you inline an `<svg>` directly in a template rather than via a component, Astro scopes both the parent and child selectors normally. Example: the green profile-avatar SVG in the home phone mock uses `.phone-ui__header-profile svg { ... }` without `:global()`, and the compiled selector correctly matches the scoped attribute on both elements.

**Rule of thumb**: `:global()` is needed for elements emitted by Astro components; not for raw HTML/SVG in the template.

### Design-token CSS custom properties are global by design

Tokens defined in `src/styles/global.css`'s `:root` block are accessible to every component. CSS custom properties defined in a component's scoped `<style>` block are scoped the same way selectors are, so if child components need to consume a value, define it globally.

---

## Icon Placement Map

Current locations where the My AI Bartender app icon (`src/assets/my-ai-bartender-icon.png`) is rendered:

| Page | File | Size | Treatment |
|---|---|---|---|
| Home — phone mock header | `src/pages/index.astro` | 36 × 36 | 10 px `border-radius`, `overflow: hidden` clip |
| Products listing — featured card | `src/pages/products/index.astro` | 72 × 72 | 22% `border-radius` (iOS squircle), soft drop shadow, flex row with H2 |
| Product detail — hero | `src/pages/products/my-ai-bartender.astro` | 120 × 120 | 22% squircle, soft drop shadow, centered below H1 |

All three import the same source file. Astro generates per-site size/density variants and deduplicates identical outputs.

---

## Deployment Quirks

### Build output location

`astro.config.mjs` sets `build.assets: 'assets'`, overriding Astro's default of `_astro`. Optimized image variants land in `dist/assets/` — not `dist/_astro/`. When verifying the image pipeline, look in `dist/assets/` for files matching `my-ai-bartender-icon.*.webp`.

### CI triggers on any push to `main`

The GH Action at `.github/workflows/azure-static-web-apps.yml` fires on every push to `main`. A doc-only change still triggers a full build + redeploy (~1 min) that produces an identical site. The cost is acceptable and the alternative (path-filtered triggers) would risk missing edge cases.

### Direct-to-main push guard (Claude Code)

Pushes to `main` are gated by a permission guard in the local Claude Code harness. When running under auto mode, the guard may block direct pushes even with prior authorization. Workaround: the user runs `! git push origin main` from the prompt, which executes the push in their local session.

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

### 5. `hero__phone-img` fallback mechanism

`src/pages/index.astro:70` renders `<img src="/images/app-preview.png" onerror="...">`. That file doesn't exist in `public/`, so the image fails to load, the `onerror` handler hides it, and the CSS-rendered `.hero__phone-fallback` (the phone mock in HTML) always shows. If someone later drops a real app screenshot at `public/images/app-preview.png`, the entire CSS phone mock stops rendering in favor of the image — including all the styled elements (app icon, concierge card, feature tiles, profile avatar) that this doc describes.

### 6. No linting or formatting in CI

The repo doesn't run ESLint, Prettier, or `astro check` in CI. When editing files on Windows, be careful not to introduce line-ending churn — Git is configured to convert LF ↔ CRLF, which can show up as noise in diffs.

### 7. Untracked reference PNGs in repo root

The repo root contains several untracked screenshot PNGs (`color01.png`, `old01.png`, `icon01.png`, etc.) that the product owner drops in as reference material during planning. They are not site assets and should not be committed. Git status will keep flagging them as untracked until explicitly gitignored or removed.

---

## History notes

Significant implementation decisions captured here for future reference:

- **Palette migration (commit `7496b59`)** — Site-wide swap from inherited My AI Bartender purple (`#8b5cf6` + variants) to the Xtend-AI brand blues (`#022A56` + `#188CFF`). Introduced `--xt-accent`, `--xt-accent-light`, `--xt-navy`, `--xt-navy-deep`, `--xt-link`, and `--xt-gradient-accent-text`. Renamed `--xt-gradient-purple` → `--xt-gradient-brand`. Renamed CSS class modifiers from `--purple` to `--accent` across templates.
- **App icon integration (commits `0ec296f`, `b1526d9`, `8e1cf8c`)** — Introduced `src/assets/` as the canonical location for `<Image>`-processed images, starting with `my-ai-bartender-icon.png`. First use of `astro:assets` in the codebase.
- **Profile avatar SVG conversion (commit `a452b4c`)** — Replaced `👤` emoji with an inline SVG person silhouette on a solid green disc, because emoji colors can't be controlled via CSS.
