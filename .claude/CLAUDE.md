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

**§17 "Open Items" in `XTEND-AI-WEB.md` is the launch backlog.** "Add at launch" tasks wait there (the `needlegirlie.com` link did until 2026-10-06). Check it before any content change and strike the item through in the same commit that ships it.

---

## Commands

```bash
npm install         # dependencies
npm run dev         # dev server → http://localhost:4321
npm run build       # production build → dist/
npm run preview     # serve the built output locally
AMBIENT_DELAY_MS=0 npm run build   # worst-case build: every ambient clip starts at load (the Lighthouse / LCP gate)
grep -rl $'\xe2\x80\x94\|\xe2\x80\x93' dist --include='*.html'   # dash gate after every build: must print nothing (brief §12.5). grep -P '\x{2014}' errors in Git Bash.
curl -s -o /dev/null -w '%{http_code}\n' https://www.xtend-ai.com/no-such-page   # 404 gate after every deploy (a 200 means navigationFallback came back)
curl -s -o /dev/null -w '%{http_code} %{redirect_url}\n' https://www.xtend-ai.com/about   # must be 301 to /about/ (SWA trailingSlash)
```

There is **no linter, formatter, or type check in CI**. `npm run build` is the only gate — run it before every commit.

Browser preview: `preview_start` with name `dev` (or `preview` for the built output), both in `.claude/launch.json` on port 4321. When grepping `dist/` for copy, built tags carry `data-astro-cid-*` attributes and keep source line breaks, so match loosely.

---

## Repo map

```
src/
  layouts/BaseLayout.astro      # <head> (title first, canonical, OG/Twitter), the JSON-LD @graph (Organization + ProfessionalService,
                                #   WebSite, WebPage, breadcrumbs), named head slot, font preloads; props pageType, breadcrumbs, ogImage, noindex
  components/                   # Header.astro, Footer.astro, FeatureCard.astro, StoreLinks.astro, Icon.astro,
                                #   AmbientVideo.astro + AmbientToggle.astro (hero background clip + its pause control),
                                #   HeroTesseract.astro (the hero's 4-D cube of light, drawn on a canvas)
  pages/                        # file-based routing
    index.astro                 # home (largest file — hero, credibility bar, services-first sections)
    services.astro  work.astro  about.astro  contact.astro
    support.astro  privacy.astro  terms.astro
    404.astro                   # served by SWA responseOverrides with status 404; noindex, no canonical; never linked
    products/my-ai-bartender.astro
    products/clique-pix.astro   # no products/index — /products 301s to /work/ in SWA config (dev and preview answer 404 for it)
  styles/global.css             # ALL design tokens live in :root here; @font-face at top
  assets/                       # images processed by <Image> at build time (app icons, reverse logo assets)
    video/                      # ambient clips (.mp4, imported so Vite hashes them) + their first-frame stills
public/                         # served verbatim — favicons, robots.txt, fonts/, og-card
api/contact/                    # Azure Function (Node) → SendGrid; INTERESTS allow-list
scripts/                        # one-off derived-asset generators (reverse logo, favicons, OG card, ambient video loops via ffmpeg) — run manually, outputs committed
docs/                           # engineering documentation
```

Navigation is **data-driven**, not hardcoded in markup. Nav changes are edits to the `navItems` array in `src/components/Header.astro` and the `navLinks` / `legalLinks` arrays in `src/components/Footer.astro`. Update both. `/products/*` pages highlight **Work** via the `navSectionFor` map in Header.astro.

---

## Rules that are easy to get wrong

1. **Design tokens only.** Every color, space, and radius comes from a `var(--xt-*)` token defined on `:root` in `src/styles/global.css`. Do not put raw hex values in component `<style>` blocks — add or reuse a token.

2. **Do not import `xtend-ai_brand_tokens.css`.** That root-level file defines *the same variable names with different values* (e.g. `--xt-navy-900: #022A56` vs. the site's `#12121a`). It is reference-only. Importing it would silently invert backgrounds and text colors site-wide.

3. **Images the site renders go in `src/assets/`** and are rendered with `<Image>` from `astro:assets` — never a raw `<img>` pointed at `public/`. A 1.7 MB source PNG becomes a ~2–12 KB WebP variant. `public/` is only for fixed-URL files (favicons, `robots.txt`, domain validators) and already-optimized images. Video clips follow the same rule: imported from `src/assets/video/`, so Vite emits hashed `.mp4` URLs and a missing clip fails the build.

4. **`<Image>` inside a scoped `<style>` block needs `:global(img)`.** Astro's style scoping doesn't reliably reach the `<img>` an Astro component emits. Raw inline `<svg>` in a template does *not* need `:global()`.

5. **Fixed-position overlays must be DOM siblings of `<header>`, never descendants.** `.header` carries `backdrop-filter: blur(20px)`, which makes it the containing block for any `position: fixed` child — this silently collapsed the mobile menu to 0 px tall. Applies to any future drawer, modal, or toast.

6. **Emoji cannot be recolored with CSS — and the site now contains none.** Icons come from `src/components/Icon.astro` (vendored Tabler stroke glyphs, `currentColor`); add glyphs there rather than hand-drawing SVG paths or reaching for emoji.

7. **Don't commit the reference PNGs in the repo root.** `color01.png`, `old01.png`, `icon01.png` and similar are planning screenshots the owner drops in, and `CLIQUE_Pix/` holds source brand assets. They are not site assets — anything the site renders gets copied into `src/assets/` first.

8. **Watch line endings on Windows.** Git converts LF ↔ CRLF and nothing normalizes it in CI, so a careless edit can produce a whole-file diff. `git ls-files --eol <file>` shows stored vs. working-tree endings (most files are `i/lf w/crlf`; `work.astro` is `w/lf`). Scripted edits must write back the file's existing ending; check `git diff --stat` before committing.

9. **The contact interest list lives in two files.** The `<select>` options in `src/pages/contact.astro` and the `INTERESTS` allow-list in `api/contact/index.js` must match — a value missing from the Function's list never reaches the email subject.

10. **Decorative video is never first paint.** A `<video>` in markup carries no `autoplay`, `src` or `poster`; `AmbientVideo.astro`'s script loads it after `load` plus a delay and only where nothing says no. A full-bleed clip sits over its own first-frame still so the still, not the video, is the LCP element (measured: Chrome otherwise registers the faded-in video as a late LCP). Every placement renders `<AmbientToggle />` as a sibling after the content wrapper, and any other auto-playing motion registers with that control: `data-motion` on its root while it can animate, `data-motion-playing` while it does, an `xt-motion` event on `document` at each change (`HeroTesseract.astro` is the reference). Details and the worst-case measuring build in `docs/IMPLEMENTATION.md`, *Ambient video* and *Hero tesseract*.

11. **Canvas animation rules.** Reduced motion and the constrained-device signals get one static frame, never a loop; nothing is allocated per frame; DPR is capped at 2 and the backing store at 1024 px; every loop that walks image sizes is bounded (an unbounded halving loop froze two browsers during development). See `docs/IMPLEMENTATION.md`, *Hero tesseract*.

12. **Client-work status lives in four places.** The `engagements` entry in `src/pages/work.astro` (`status`, `note`, `href`, `live`), the home Proof paragraph in `src/pages/index.astro`, the brief (§4.5, §6, §6.1, §12.5, §17), and a `docs/IMPLEMENTATION.md` history note. A launch or status change touches all four in one commit. The card's link label derives from the URL, so engagement #2 is a data edit only.

13. **Long heredocs fail in the Claude Code Bash tool here** (`unexpected EOF while looking for matching '` even when single-quoted). Write multi-line scripts to a file with the Write tool, then run them from Bash.

14. **Internal links use the trailing-slash form** (`/services/`, `/products/clique-pix/`). Astro runs with `trailingSlash: 'always'`, so the dev server and `npm run preview` answer 404 for `localhost:4321/about`; that is the check working, not a bug. In production SWA 301s the slash-less form. The Header's `navSectionFor` map is compared with `===`, so its value must stay `/work/`. Unknown URLs must answer 404 (`src/pages/404.astro`, served by `responseOverrides`); never reintroduce `navigationFallback`.

15. **Metadata and structured data have a spec.** Titles and descriptions live in brief §11's table; the JSON-LD graph (`BaseLayout.astro`, one `@graph` per page with `@id`s) and the page-level `Person` and `MobileApplication` entities are described there too. Change the brief in the same commit, put nothing in the data that is not on the site or owner-approved, and check `https://validator.schema.org/#url=<page>` (0 errors). Layout props: `pageType`, `breadcrumbs` (slash form), `ogImage` as an object with real dimensions, `noindex` (404 only).

---

## Deployment

Push to `main` → GitHub Actions (`.github/workflows/azure-static-web-apps.yml`) → build → deploy. Every push triggers a full rebuild, including doc-only changes (~1 min). The SWA hostname and the apex `xtend-ai.com` answer 301 to `www.xtend-ai.com`, the SWA default domain since 2026-10-07.

**Push guard:** direct pushes to `main` from Claude Code may be blocked by the local permission guard even with prior authorization. When that happens, hand the push back to the user: `! git push origin main`.

**SWA config changes go through a pull request.** `staticwebapp.config.json` is validated only at deploy, and the workflow builds a staging environment for every PR. Test there before merging: the redirect, 404 and cache matrix in `docs/IMPLEMENTATION.md` (*Redirects, trailing slashes and the 404 page*), and the contact API with an empty-body probe (`curl -si -X POST -H 'Content-Type: application/json' --data '{}' https://<staging-host>/api/contact` must return 400), never a real submission, because staging inherits `SENDGRID_API_KEY`.

**Verifying a deploy:** `gh run list --commit $(git rev-parse HEAD)` finds the SWA run and `gh run watch <id> --exit-status` follows it (~1.5 min). Then fetch the changed page on `https://www.xtend-ai.com` with `curl -H 'Cache-Control: no-cache'`; a look taken right after the push still shows the old build. The SWA hostname and the apex answer 301 to `www` (default domain set 2026-10-07), so check `www` only. Two standing gates after every deploy: an unknown path must return 404, and `/about` must 301 to `/about/` (both in the Commands block). GitHub has rejected a push with `remote: Internal Server Error` (objects uploaded, ref untouched); a plain retry succeeded with nothing to clean up.

Secrets are set in Azure SWA configuration, not in the repo. Currently only `SENDGRID_API_KEY`.

---

## Working style expectations

- **Architecture before code.** For anything larger than a copy tweak, propose the plan and get agreement before editing files.
- **Ask when the brief is silent.** Missing messaging is a question for the owner, not a gap to fill with invented marketing copy.
- **Small, reviewable commits** with a clear subject line. One concern per commit.
- **Update the docs in the same change.** Messaging → `XTEND-AI-WEB.md`. Tokens, patterns, gotchas, or a new architectural decision → `docs/IMPLEMENTATION.md` (it has a `History notes` section for exactly this). Setup or deploy changes → `README.md`.
