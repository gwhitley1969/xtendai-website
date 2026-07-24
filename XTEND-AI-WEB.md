# Xtend-AI Website Brief (Developer Hand-Off)

**Target**: Corporate marketing site for Xtend-AI, LLC
**Hosting**: Azure Static Web Apps (SWA)
**Custom Domain**: `www.xtend-ai.com`
**Azure SWA Hostname**: `gentle-sea-0d684ea10.2.azurestaticapps.net`

> Purpose: This document is the source of truth for building the Xtend-AI corporate site. Follow it closely (no invented messaging, no extra pages unless asked).

---

## Revision note — 2026-07-24 services repositioning

Xtend-AI was founded as a consumer mobile app company. It still is one, but it now also **designs and builds websites and web applications for client companies**, and that is currently the growing side of the business. This revision adds the services audience to a site that previously spoke only to app-store consumers.

What changed in this document:

| Section | Change |
|---|---|
| §0 Primary Goals | Rewritten — two audiences, services lead |
| §1 Positioning | Rewritten — new statement approved, covers product and services |
| §2 Tagline | Rewritten — new tagline approved, replaces the product-only line |
| §3 Sitemap | Rewritten — new nav, `/products` redirect |
| §4 Home | Rewritten — services-first structure |
| §5 Services | **New page** |
| §6 Work | **New page** |
| §7 Product detail pages | Revised — CLIQUE Pix has shipped |
| §8 About | Rewritten around the founder |
| §9 Support | Scope-limited to app support |
| §10 Contact | Interest selector added |
| §11 SEO & structured data | New section |
| §12 Brand / Design System | **Unchanged** — formerly §9. Palette and type are not changing. |
| §13–§17 | Renumbered, content substantially unchanged |

Decisions locked by the owner: services-first lead; My AI Bartender still live and keeps its product page; CLIQUE Pix has shipped and gets its own product page; the client may be named; local emphasis plus remote-friendly; no pricing published; the founder is named on About; positioning and tagline approved as written in §1 and §2.

---

## 0) Primary Goals (do not drift)

Build a clean, mobile-first, high-trust corporate website that serves **two audiences without confusing either**.

**Primary audience — a business owner evaluating whether to hire Xtend-AI.**
Typically arrives by referral, is not technical, and needs to learn in under a minute: what we build, that we have actually shipped things, why we are different from a template shop, and how to start a conversation.

**Secondary audience — a consumer who found one of our apps.**
Arrives from an app store listing or a share link, wants the app page or support. Must not be lost, but is no longer who the home page is written for.

The site must therefore:

- lead with **what Xtend-AI builds for clients** — websites, mobile apps, and the cloud infrastructure underneath
- establish credibility through the founder's architecture background and through work actually shipped
- present our own apps as **proof of capability**, not as the point of the company
- give a business owner a qualified, low-friction way to start a conversation
- keep app users able to reach product pages and support

Structural goal: adding client engagement #2 and #3 must be a data-array edit, not a redesign.

---

## 1) Positioning (APPROVED)

Use this exact copy (Home + About):

> Xtend-AI designs and builds websites, mobile apps, and the cloud infrastructure underneath them — created by an architect with over thirty years in enterprise systems, not assembled from templates. We ship our own apps, which is how we know how to ship yours.

The previous approved statement — *"Xtend-AI creates AI companion apps that extend what you can do…"* — described a consumer app company only and is superseded. Remove it from `index.astro` and `about.astro`.

**Why this statement:** it leads with the differentiator. "Architected… not assembled from templates" is the one claim a template shop cannot copy, and the closing sentence converts the app line from a distraction into evidence. It does not carry the Charlotte anchor — that is handled by the Services and About prose and by the `ProfessionalService` structured data (§11).

**Wording rule — architect, never engineer.** The founder is described as an *architect* throughout the site: "created by an architect with over thirty years," "solutions architect," "you talk to the architect who builds it." Never "engineer." This is both a personal preference and an accuracy point — the credentials being claimed (AZ-305 Solutions Architect Expert, IBM Certified Architect Level 2, Open Group Certified Master Architect) are architect certifications, and they are the company's principal credibility asset. Check any new copy for the word before it ships.

---

## 2) Tagline (APPROVED)

Use this exact tagline (header / hero / footer as appropriate):

> Web, mobile, and the cloud beneath

The previous tagline, *"Your next favorite app, made smarter,"* is product-only and is superseded. Replace it everywhere it appears — currently `Header.astro` (beside the logo) and `Footer.astro` (`.footer__tagline`).

**Implementation constraint:** the header renders the tagline at `white-space: nowrap`, 0.65rem on mobile. The superseded tagline was 36 characters and fit at 375 px; this one is 34. Treat ~36 characters as the hard ceiling for any future change, and re-check at 375 px whenever it changes.

---

## 3) Navigation / Sitemap

### Top navigation

1. Home — `/`
2. Services — `/services`
3. Work — `/work`
4. About — `/about`
5. Contact — `/contact`

Five items, no dropdown. The Products dropdown is removed: with a services-first home page, product detail pages are proof and belong under Work, not in the primary nav.

### Footer navigation

Services • Work • About • Support • Contact

Legal row: Privacy • Terms

**Support is footer-only.** It is app-support-specific (see §9). Leaving it in the top nav invites a prospective client to read it and conclude we are a support desk.

### URLs that are not in the navigation

| URL | Status | Reason |
|---|---|---|
| `/products/my-ai-bartender` | Keep, unchanged | Linked from the live App Store and Google Play listings. Reached from `/work`. |
| `/products/clique-pix` | **New** | CLIQUE Pix has shipped; parity with My AI Bartender. |
| `/support` | Keep, footer-only | App support. |
| `/privacy`, `/terms` | Keep, footer-only | Legal. |

### Redirect

| From | To | Type |
|---|---|---|
| `/products` | `/work` | 301 |

Rationale: the `/products` index and the "our own apps" half of `/work` would say the same thing about the same two apps. Two pages with duplicate content is both an SEO liability and exactly the kind of drift this brief exists to prevent. The detail pages keep their existing URLs, so nothing already shared in the wild breaks. Implemented in `staticwebapp.config.json`, which already has a `routes` array.

---

## 4) Home Page Content

Target shape, in order. Replaces the previous Hero → Features bar → What we do → Featured product → Why we're different → What's next.

### 4.1 Hero

**H1:** Websites and apps, *architected to last*
*("architected to last" carries the `.text-gradient` treatment.)*

**Subheadline:** Xtend-AI designs and builds websites, mobile apps, and the cloud infrastructure that runs them. Based in the Charlotte area, working with clients anywhere — and you deal directly with the architect who builds it.

**Primary CTA:** See what we build → `/services`
**Secondary CTA:** Start a project → `/contact`

> The "starting with My AI Bartender" line is removed.

**Open implementation question — the hero visual.** The hero currently renders a CSS phone mock of the My AI Bartender UI. On a services-first home page that image re-signals "app company" in the first screen. Three options, owner to decide in Phase 4:
> **(a)** Keep it as-is — zero cost, and it is honest proof of shipped mobile work.
> **(b)** Pair it with a browser frame so the visual says "both halves" — on-message, but real design work.
> **(c)** Replace it once a client website screenshot exists.
> Recommendation: **(a)** now, revisit at (b) or (c) when Needle Girlie launches.

### 4.2 Credibility bar

Replaces the Chat / Voice / Scan My Bar / Create features bar, which is My AI Bartender feature copy sitting on the company home page.

Four items, same four-across layout:

| Value | Label |
|---|---|
| Azure Certified | AZ-305 Solutions Architect Expert |
| 30 years | The founder's career in enterprise infrastructure |
| 2 apps shipped | Live on the App Store and Google Play |
| Charlotte / Harrisburg, NC | Local, and remote-friendly |

> **Do not blur the founder's experience with the company's age.** The thirty years belongs to the founder and the label must say so. Xtend-AI, LLC is young. Never imply otherwise.

### 4.3 Section: What we do

**Headline:** Websites, apps, and the cloud beneath them

**Body:**
Most shops build one of the three and hand off the rest. We build all three, because they are the same problem: a site that loads fast, an app that ships to both stores, and Azure infrastructure that holds them up. Designed together, on one system — not bolted together after the fact.

### 4.4 Section: Services teaser

Three cards, each linking to `/services`.

1. **Websites** — Designed and built mobile-first. Fast, accessible, SEO-ready, and deployed as static files to a global CDN — not a page builder with a monthly subscription attached.
2. **Mobile apps** — iOS and Android from a single Flutter codebase, with an Azure backend when the app needs one. We have shipped two of our own to both stores.
3. **Cloud & hosting** — Azure architecture, infrastructure as code, custom domains and real DNS delegation, security headers, CI/CD on every push, and monitoring after launch.

**CTA:** See all services → `/services`

### 4.5 Section: Proof

**Headline:** Work we're shipping

**Body:**
We are building a website and a Flutter mobile app for Needle Girlie, a medical aesthetics practice in Harrisburg, NC. We have also shipped two apps of our own — My AI Bartender and CLIQUE Pix — both live on the App Store and Google Play.

**CTA:** See our work → `/work`

### 4.6 Section: Why we're different

**Headline:** We don't assemble websites. We architect systems.

**Cards (3)** — rewritten to speak to a client buyer. The previous three (multi-modal by design, purpose-built not generic, human UX first) are product-company claims and are removed from this page.

1. **Architected, not assembled** — Static-first builds, infrastructure as code, real DNS delegation, security headers, CI/CD on every push, and per-client tenant isolation. The same discipline as enterprise systems, at the size of your business.
2. **Both halves, one system** — Website and mobile app on the same design system, with AI features only where they earn their place. One team, one look, one place to call.
3. **Small, senior, direct** — You talk to the architect who builds it. No account manager, and no handoff to a junior team after the pitch.

### 4.7 Section: Closing CTA

**Headline:** Let's talk about your project

**Body:** Tell us what you're trying to build. You'll get a straight answer about whether we're the right fit — and if we are, an architecture, a timeline, and a number.

**CTA:** Start a project → `/contact`

### 4.8 Footer microcopy

**Xtend-AI** — Websites, mobile apps, and the cloud infrastructure underneath.
Links: Services • Work • About • Support • Contact • Privacy • Terms

---

## 5) Services Page — NEW (`/services`)

The core commercial page.

### 5.1 Hero

**H1:** Websites, apps, and the infrastructure to run them

**Subheadline:** We design and build your website and your mobile app, then run them on cloud infrastructure we architect ourselves — so there is one team responsible when something needs to change.

### 5.2 Three service cards

**Websites**
Design and build, mobile-first from the first pixel. Fast, accessible, and SEO-ready. Your site ships as static files to a global CDN, so it loads in well under a second — no CMS to patch, no plugin to break, no monthly platform fee. Custom domain, HTTPS, and security headers configured properly on day one.

**Mobile apps**
iOS and Android from a single Flutter codebase: one build, both stores, one set of changes to maintain. When an app needs a backend we build it on Azure — authentication, storage, notifications, and APIs designed around what the app actually does. We ship our own apps this way; My AI Bartender and CLIQUE Pix are both live.

**Cloud & hosting**
This is the part most shops hand to someone else. We architect it. Azure resources defined as infrastructure as code, DNS delegated and managed properly, CI/CD that deploys on every push, TLS and security headers, monitoring and alerting after launch, and per-client tenant isolation so your environment is yours alone. Ongoing management if you want it.

> Cloud & hosting is the credibility anchor. Do not bury it, do not shorten it below the other two, and do not let a redesign reorder it out of view.

### 5.3 How we work

**Section heading:** Five steps, no jargon

Five steps. No consulting jargon, no invented methodology name.

1. **Discovery** — A conversation about what you're trying to accomplish and who it's for. No questionnaire, no discovery fee.
2. **Architecture** — Before anything gets built you get the plan: what we're building, what it runs on, what it costs to run, and how long it takes.
3. **Build** — We build in the open. You watch it come together on a real URL, not in a slide deck at the end.
4. **Launch** — Domain, DNS, TLS, security headers, analytics, and store submission if there's an app. We handle the parts that usually go wrong.
5. **Support** — We stay on: updates, monitoring, and changes as the business changes. Or a clean handoff with documentation if you'd rather run it yourself.

### 5.4 Why us

**Headline:** Thirty years of enterprise architecture, pointed at your business.

**Body:**
Xtend-AI is led by a solutions architect with roughly three decades in enterprise infrastructure and cloud. Microsoft Azure certified — AZ-305 Solutions Architect Expert, AZ-104, AZ-700, and AZ-900 — formerly an IBM Certified Architect Level 2 (Expert) and an Open Group Certified Master Architect, and a contributing author on five published technical books.

That background is the difference between a site that looks finished and a system that keeps working after you stop paying attention to it.

**Supporting points:**

- **Architected, not assembled.** Static-first for speed, deployed to Azure with infrastructure as code, real DNS delegation, security headers, CI/CD on every push, and per-client tenant isolation. Not a page builder with a subscription attached.
- **We ship both halves.** The website and the mobile app, on the same design system, with AI features when they actually earn their place.
- **We build our own products.** My AI Bartender and CLIQUE Pix are live in both stores. We run the same stack we would put you on.
- **Small, senior, direct.** You talk to the architect who builds it, not an account manager.
- **Local, and remote-friendly.** Based between Charlotte and Harrisburg, NC. Happy to meet in person; equally happy to work entirely remotely.

### 5.5 CTA

**Headline:** Tell us what you're building

**Body:** Every project is scoped individually — tell us what you need and we'll come back with an architecture, a timeline, and a number.

**CTA:** Start a project → `/contact`

> The body line carries the no-pricing decision (§5.6) honestly: it tells a buyer they will get a number, just not off a menu.

### 5.6 Pricing

**No pricing is published on the site.** Every engagement is scoped individually; the contact form's interest selector does the qualifying. Do not add a pricing table, a "starting at" figure, or a package comparison without the owner's explicit approval — the differentiator is architecture, and a published number invites the comparison against a $99/month page builder that we are deliberately not competing in.

---

## 6) Work Page — NEW (`/work`)

Proof, not a brag wall. One client engagement in progress and two shipped apps of our own. Build it from data arrays so engagement #2 is an array entry, not a redesign.

**Intro:** One client engagement in progress, and two apps of our own live in both stores. This page grows as the work does.

### 6.1 Client work

**Needle Girlie** — medical aesthetics practice of Amy Palacios, FNP, in Harrisburg, NC.

| Field | Content |
|---|---|
| What we're building | A website and a Flutter mobile app with an AI assistant. |
| Stack | Static site on Azure Static Web Apps; Flutter for iOS and Android; Azure backend; AI assistant. |
| Status | **In progress.** The public site is currently an "under construction" placeholder while the full build is underway. |

**Naming:** the owner has confirmed the client may be named. **Do not link `needlegirlie.com` while it is a placeholder** — sending a referral to a holding page costs more trust than the outbound link gains. Add the link at launch.

**Treatment:** a card with an honest "in progress" badge. No screenshot, no mockup, no fabricated preview.

> **OWNER TO PROVIDE:** one or two sentences on the problem this engagement solves — what the practice needed that it did not have. Everything above is fact; the "why" is not written down anywhere and must not be invented. Until it is supplied, ship the card without a problem statement.

### 6.2 Our own apps

**Framing line:** We build and ship our own products on the same stack we would put you on. That is not a portfolio flex — it is why we know what breaks.

**My AI Bartender** — live.
Discover cocktails, make smarter substitutions, and use what you already have. Chat, voice, camera-based bottle scanning, and recipe creation.
Store links: [App Store](https://apps.apple.com/us/app/my-ai-bartender-scan-create/id6758023541) • [Google Play](https://play.google.com/store/apps/details?id=ai.mybartender.mybartenderai)
Links to `/products/my-ai-bartender`.

**CLIQUE Pix** — live.
Private, event-based group photo sharing. Create temporary Events or persistent Cliques, snap and share photos and videos in real time, and let everything disappear when the moment is over.
Store links: [App Store](https://apps.apple.com/us/app/clique-pix-group-pic-sharing/id6766294274) • [Google Play](https://play.google.com/store/apps/details?id=com.cliquepix.clique_pix)
Links to `/products/clique-pix`.

> **Store URL rule.** Always link the canonical listing form — `play.google.com/store/apps/details?id=<package>` and `apps.apple.com/.../id<numeric>`. Never a `store/search?q=` URL: Play search returns whatever ranks that day (including competitors) and cannot deep-link into the Play app. CLIQUE Pix is package `com.cliquepix.clique_pix` / Apple ID `6766294274`; My AI Bartender is `ai.mybartender.mybartenderai` / `6758023541`.

> **Spelling:** it is **CLIQUE Pix** — capital CLIQUE, capital P, lowercase ix. The site currently says "Clique Pix" in several places; all of them are stale.

---

## 7) Product Detail Pages

### 7.1 My AI Bartender — `/products/my-ai-bartender`

Live. Keep the existing structure: hero with app icon, name, short description, and store links; "How it works" in four steps; "Key features" grid; responsible-use note (21+). URL must not move — it is linked from both live store listings.

Two stale strings were corrected during the repositioning: the closing CTA said *"Join the waitlist to be notified when My AI Bartender launches"* on a page that also carried an "Available Now" badge and links to both live stores, and the badge itself read "Available Now!!!". Both are fixed.

### 7.2 CLIQUE Pix — `/products/clique-pix` — NEW

Parity with My AI Bartender.

- Hero: app icon + name + short description + store links
- What it does: temporary Events and persistent Cliques; real-time photo and video sharing; content disappears when the moment is over
- Built with Flutter and Azure
- Store links: as recorded in §6.2

**Icon asset:** ~~use `CLIQUE_Pix/play_app_icon_512x512.png`~~ — Done. Copied to `src/assets/clique-pix-icon.png` and rendered with `<Image>` at the same sizes and 22% squircle radius as the My AI Bartender icon. `public/images/cliquepix-logo.png` was the same artwork served unprocessed and has been deleted. The other files in `CLIQUE_Pix/` are the same mark at lower resolution or with a baked-in light background — unusable on a dark theme.

> The "Coming Soon (Clique Pix)" framing everywhere on the site is now false. CLIQUE Pix has shipped.

---

## 8) About Page

Rewritten. For a services buyer the founder's credentials **are** the credibility, so the page is built around them.

- **H1:** About Xtend-AI
- **Lead paragraph:** the approved positioning statement, once §1 is decided.
- **Company paragraph:** Xtend-AI, LLC is a small studio based between Charlotte and Harrisburg, North Carolina. We design and build websites, mobile apps, and the Azure infrastructure that runs them, for client companies — and we build and ship our own consumer apps on the same stack.
- **Founder paragraph:** Xtend-AI was founded by **Gene Whitley** *(owner to confirm spelling — inferred from repository authorship, not supplied in writing)*, a solutions architect with roughly thirty years in enterprise infrastructure and cloud architecture. Microsoft Azure certified: AZ-305 Solutions Architect Expert, AZ-104, AZ-700, AZ-900. Formerly an IBM Certified Architect Level 2 (Expert) and an Open Group Certified Master Architect. Contributing author on five published technical books.
- **The point of that paragraph, stated plainly:** when you hire Xtend-AI you are working with the person who designs the system and writes the code. There is no account manager and no handoff.

### Values (revised)

The previous four read as product-company values. Revised to work for both halves of the business:

1. User experience comes first
2. Architecture before code
3. AI should be helpful, not hype
4. Ship it, then stand behind it

**Do not claim** a founding year, a client count, an employee count, awards, or testimonials. None of those are established.

---

## 9) Support Page

Simple, credible, and **explicitly scoped to app support**.

**Scope banner, at the top of the page:**
> This page is for help with our apps — My AI Bartender and CLIQUE Pix. If you're a business looking to hire us to build a website or an app, start at [Services](/services) or [Contact](/contact).

Rationale: a prospective client who lands here by accident must not conclude that Xtend-AI is a support desk. This is also why Support is footer-only in the navigation (§3).

- Support email: `support@xtend-ai.com`
- Response time: 24–48 hours
- FAQ: existing My AI Bartender entries stay. **OWNER TO PROVIDE** CLIQUE Pix FAQ entries — do not invent app behavior, pricing, or platform support for CLIQUE Pix.

---

## 10) Contact Page

Contact form fields:

| Field | Required | Notes |
|---|---|---|
| Name | No | Unchanged |
| Email | **Yes** | Unchanged |
| **Interest** | **Yes** | **New.** Select: New website / Mobile app / Cloud & hosting / Support / Something else |
| Message | **Yes** | Unchanged |
| `website` honeypot | — | Hidden. Unchanged anti-spam behavior. |

The interest value must reach the inbox **in the email subject line**, so a lead is qualified without opening the message:

```
[Xtend-AI Contact] New website — Jane Smith
```

and must also appear as a row in the email body. Wired through `api/contact/index.js`.

**Backwards compatibility:** the Azure Function must keep accepting a payload with no `interest` field. A visitor with the old page cached mid-session must not get an error.

---

## 11) SEO & Structured Data

### Per-page metadata

| Page | Title | Description |
|---|---|---|
| `/` | Xtend-AI \| Web & Mobile App Development — Charlotte, NC | Xtend-AI designs and builds websites, mobile apps, and the Azure cloud that runs them — architected, not assembled. Charlotte & Harrisburg, NC, and remote. |
| `/services` | Web, Mobile & Cloud Services \| Xtend-AI | Website design and development, iOS and Android apps from one Flutter codebase, and Azure architecture, deployment, and hosting. Charlotte, NC and remote. |
| `/work` | Our Work \| Xtend-AI | Client engagements and the apps we've shipped ourselves — My AI Bartender and CLIQUE Pix, live on the App Store and Google Play. |
| `/about` | About \| Xtend-AI | Xtend-AI is a Charlotte-area studio led by a solutions architect with 30 years in enterprise infrastructure and cloud. Azure certified, published author. |
| `/contact` | Contact \| Xtend-AI | Start a project with Xtend-AI. Tell us whether you need a website, a mobile app, cloud and hosting, or product support — we respond within 24–48 hours. |
| `/support` | App Support \| Xtend-AI | Help with My AI Bartender and CLIQUE Pix. FAQs, bug reports, and support contact. For new project inquiries, see Services. |

Product detail page titles keep their app focus.

### Structured data

- **`Organization`** in `BaseLayout.astro` — name, URL, logo. Applies site-wide.
- **`ProfessionalService`** on `/services` — service area covering the Charlotte metro and Harrisburg, NC, plus the services offered. City and region only; **no street address is published** unless the owner asks for one.

Location terms go into the Services and About prose naturally. Do not keyword-stuff, and do not add a city list.

### Sitemap

Automatic via `@astrojs/sitemap`. Confirm `/services`, `/work`, and `/products/clique-pix` appear in `dist/sitemap-*.xml` after the build.

---

## 12) Brand / Design System (Implementation Guidance)

> **Unchanged by the services repositioning.** The palette and typography are not changing. Formerly §9.

### 12.1 Color palette (from logo)

Core:

- Navy (deep): `#00052A`
- Navy (primary text / headers): `#022A56`
- Accent Blue (brand pop): `#188CFF`
- Soft tint (background wash): `#98B7D2`

Accessibility note:

- `#188CFF` on white is not strong enough for small body text.
- Use this for links on white: `#0B6FE6`

Recommended brand gradient:

```css
linear-gradient(135deg, #022A56 0%, #188CFF 100%)
```

> The live site implements these as `var(--xt-*)` tokens on `:root` in `src/styles/global.css`. See `docs/IMPLEMENTATION.md` for the token table and the warning about the colliding `xtend-ai_brand_tokens.css` file in the repo root.

### 12.2 Typography

Preferred:

* Headings: **Sora** (600–700)

* Body: **Inter** (400–500)

Fallback (no external fonts):

* `system-ui, -apple-system, Segoe UI, Roboto, Arial, sans-serif`

### 12.3 Layout & spacing

* Max content width: 1120–1200px

* 8px spacing grid

* Section padding: 72–96px desktop, 48–64px mobile

* Component radius: 12–16px

* Cards: subtle border, minimal shadow

### 12.4 Buttons

Primary CTA:

* BG `#022A56`, text white

* Hover: BG `#188CFF`, text `#00052A` (keep contrast)

Secondary CTA:

* Outline 2px `#022A56`, text `#022A56`

* Hover: very light tint background

---

## 13) Assets

Preferred assets:

* Full logo (transparent)

* X mark only (for favicon/app icon)

* Wordmark only (transparent)

* Favicon bundle (`favicon.ico`)

* Optional CSS tokens file (if provided)

> If the original SVG exists, prefer SVG for the header logo (crisper than PNG).

App icons live in `src/assets/` and render through `<Image>`:

| App | Source | Site path |
|---|---|---|
| My AI Bartender | supplied | `src/assets/my-ai-bartender-icon.png` |
| CLIQUE Pix | `CLIQUE_Pix/play_app_icon_512x512.png` | `src/assets/clique-pix-icon.png` |

---

## 14) Technical Requirements (Azure Static Web Apps)

### 14.1 Hosting / domain

* Deploy to Azure Static Web Apps

* Use SWA hostname: `gentle-sea-0d684ea10.2.azurestaticapps.net`

* Ensure custom domain mapping for `www.xtend-ai.com`

### 14.2 Performance & quality gates

* Mobile-first responsive layout

* Lighthouse targets: Performance ≥ 90, Accessibility ≥ 90, Best Practices ≥ 90, SEO ≥ 90 — verified on Home and Services

* Minimal client JS (keep it fast)

* Optimize images (WebP/AVIF), lazy-load below fold

* Checked at 375 px, 768 px, and 1280 px

### 14.3 SEO essentials

* Unique title + meta description per page

* OpenGraph tags for share previews

* `sitemap.xml` + `robots.txt`

* Canonical URLs

* `Organization` and `ProfessionalService` JSON-LD (§11)

---

## 15) Contact Form Implementation

**Implemented: Option A (Azure-native).** SWA + Azure Function (`api/contact`) forwarding to SendGrid, with a honeypot field for anti-spam. Destination `xtendai@xtend-ai.com`.

Extended in this revision to carry the interest selector through to the email subject and body (§10).

---

## 16) Implementation Rules (for Claude Code / developer)

* **Don't invent new claims or messaging beyond this document.** In particular: no client counts, no "award-winning," no testimonials, no founding year, and no company-age claim derived from the founder's thirty years.
* The founder's ~30 years is real. Xtend-AI, LLC is young. Never blur the two.
* Keep the visual style aligned to the logo: white space + navy text + blue accents.
* Design tokens only — every color, space, and radius comes from a `var(--xt-*)` token in `src/styles/global.css`.
* Keep repo structure clean:
  * `/src` for pages/components
  * `/public` for fixed-URL assets only
  * `/docs` for engineering documentation

Deliverables:

* Working site deployed to Azure SWA

* Source repo with build instructions

* README: local dev + build + deploy steps

---

## 17) Open Items (Owner will provide)

* ~~Support email address~~ — Done (support@xtend-ai.com)
* ~~Contact form destination decision (Option A/B/C)~~ — Done (Option A: Azure Functions + SendGrid)
* ~~My AI Bartender app store links~~ — Done (App Store + Google Play live)
* ~~Client naming consent~~ — Done (Needle Girlie may be named)
* ~~§1 — positioning statement~~ — Done (architecture-led, approved)
* ~~§2 — tagline~~ — Done ("Web, mobile, and the cloud beneath")
* ~~§6.2, §7.2 — CLIQUE Pix App Store and Google Play URLs~~ — Done (canonical listing URLs recorded in §6.2)
* **§8 — confirm the founder's name spelling**
* **§6.1 — one or two sentences on the problem the Needle Girlie engagement solves**
* **§9 — CLIQUE Pix FAQ entries**
* §4.1 — hero visual decision (keep phone mock / add browser frame / replace)
* Screenshots for My AI Bartender and CLIQUE Pix (optional but recommended)
* `needlegirlie.com` link — add at launch, not before
