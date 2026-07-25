# CLAUDE.md

Working guidance for Claude Code in the **Xtend-AI corporate website** repo.
This file is deliberately thin — it points at the real documentation rather than duplicating it.
If something here disagrees with the docs below, the docs win and this file is stale: fix it.

---

## What this is

Corporate marketing site for **Xtend-AI, LLC** (Charlotte / Harrisburg, NC).

| | |
|---|---|
| Framework | Astro 5.x, `output: 'static'`, `@astrojs/sitemap` |
| Styling | Vanilla CSS + custom properties (no Tailwind, no CSS framework) |
| Fonts | Sora (headings) / Inter (body) — self-hosted woff2 in `public/fonts/`, `@font-face` in `global.css`, preloaded in `BaseLayout.astro`. No Google Fonts request. |
| Backend | One Azure Function: `api/contact` → SendGrid |
| Hosting | Azure Static Web Apps |
| Production | https://www.xtend-ai.com |
| SWA hostname | https://gentle-sea-0d684ea10.2.azurestaticapps.net |

---

## Read these before making changes

| Doc | What it is | Read it when |
|---|---|---|
| `XTEND-AI-WEB.md` | **Product brief / source of truth for messaging.** Positioning, tagline, sitemap, approved page copy, brand spec. | Any change to copy, navigation, or page structure |
| `docs/IMPLEMENTATION.md` | Engineering reference. Design tokens, asset pipeline, Astro patterns, deployment quirks, known gotchas. | Any change to CSS, images, layout, or components |
| `README.md` | Setup, build, deploy, SendGrid config, email routing table. | Environment or deployment work |
| `XTEND-AI_WEB_BRIEF.md` | Original brand-asset handoff notes. | Rarely — historical reference |

**`XTEND-AI-WEB.md` is authoritative for messaging and it says "don't invent new claims."** If a task requires new positioning or a new page, update that brief in the same change set. Never let the site and the brief drift apart.

---

## Commands

```bash
npm install         # dependencies
npm run dev         # dev server → http://localhost:4321
npm run build       # production build → dist/
npm run preview     # serve the built output locally
```

There is **no linter, formatter, or type check in CI**. `npm run build` is the only gate — run it before every commit.

---

## Repo map

```
src/
  layouts/BaseLayout.astro      # <head>, SEO/OG meta, Organization JSON-LD, named head slot, font preloads
  components/                   # Header.astro, Footer.astro, FeatureCard.astro, StoreLinks.astro, Icon.astro
  pages/                        # file-based routing
    index.astro                 # home (largest file — hero, credibility bar, services-first sections)
    services.astro  work.astro  about.astro  contact.astro
    support.astro  privacy.astro  terms.astro
    products/my-ai-bartender.astro
    products/clique-pix.astro   # no products/index — /products 301s to /work in SWA config
  styles/global.css             # ALL design tokens live in :root here; @font-face at top
  assets/                       # images processed by <Image> at build time (app icons, reverse logo assets)
public/                         # served verbatim — favicons, robots.txt, fonts/, og-card
api/contact/                    # Azure Function (Node) → SendGrid; INTERESTS allow-list
scripts/                        # one-off derived-asset generators (reverse logo, favicons, OG card) — run manually, outputs committed
docs/                           # engineering documentation
```

Navigation is **data-driven**, not hardcoded in markup. Nav changes are edits to the `navItems` array in `src/components/Header.astro` and the `navLinks` / `legalLinks` arrays in `src/components/Footer.astro`. Update both. `/products/*` pages highlight **Work** via the `navSectionFor` map in Header.astro.

---

## Rules that are easy to get wrong

1. **Design tokens only.** Every color, space, and radius comes from a `var(--xt-*)` token defined on `:root` in `src/styles/global.css`. Do not put raw hex values in component `<style>` blocks — add or reuse a token.

2. **Do not import `xtend-ai_brand_tokens.css`.** That root-level file defines *the same variable names with different values* (e.g. `--xt-navy-900: #022A56` vs. the site's `#12121a`). It is reference-only. Importing it would silently invert backgrounds and text colors site-wide.

3. **Images the site renders go in `src/assets/`** and are rendered with `<Image>` from `astro:assets` — never a raw `<img>` pointed at `public/`. A 1.7 MB source PNG becomes a ~2–12 KB WebP variant. `public/` is only for fixed-URL files (favicons, `robots.txt`, domain validators) and already-optimized images.

4. **`<Image>` inside a scoped `<style>` block needs `:global(img)`.** Astro's style scoping doesn't reliably reach the `<img>` an Astro component emits. Raw inline `<svg>` in a template does *not* need `:global()`.

5. **Fixed-position overlays must be DOM siblings of `<header>`, never descendants.** `.header` carries `backdrop-filter: blur(20px)`, which makes it the containing block for any `position: fixed` child — this silently collapsed the mobile menu to 0 px tall. Applies to any future drawer, modal, or toast.

6. **Emoji cannot be recolored with CSS.** If an icon needs a brand color, use inline SVG with `fill: currentColor`.

7. **Don't commit the reference PNGs in the repo root.** `color01.png`, `old01.png`, `icon01.png` and similar are planning screenshots the owner drops in, and `CLIQUE_Pix/` holds source brand assets. They are not site assets — anything the site renders gets copied into `src/assets/` first.

8. **Watch line endings on Windows.** Git converts LF ↔ CRLF and nothing normalizes it in CI, so a careless edit can produce a whole-file diff.

9. **The contact interest list lives in two files.** The `<select>` options in `src/pages/contact.astro` and the `INTERESTS` allow-list in `api/contact/index.js` must match — a value missing from the Function's list never reaches the email subject.

---

## Deployment

Push to `main` → GitHub Actions (`.github/workflows/azure-static-web-apps.yml`) → build → deploy. Every push triggers a full rebuild, including doc-only changes (~1 min). Both the custom domain and the SWA hostname update at once.

**Push guard:** direct pushes to `main` from Claude Code may be blocked by the local permission guard even with prior authorization. When that happens, hand the push back to the user: `! git push origin main`.

Secrets are set in Azure SWA configuration, not in the repo. Currently only `SENDGRID_API_KEY`.

---

## Working style expectations

- **Architecture before code.** For anything larger than a copy tweak, propose the plan and get agreement before editing files.
- **Ask when the brief is silent.** Missing messaging is a question for the owner, not a gap to fill with invented marketing copy.
- **Small, reviewable commits** with a clear subject line. One concern per commit.
- **Update the docs in the same change.** Messaging → `XTEND-AI-WEB.md`. Tokens, patterns, gotchas, or a new architectural decision → `docs/IMPLEMENTATION.md` (it has a `History notes` section for exactly this). Setup or deploy changes → `README.md`.
