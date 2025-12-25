# Xtend-AI Website Brief (Developer Hand-Off)

**Target**: Corporate marketing site for Xtend-AI  
**Hosting**: Azure Static Web Apps (SWA)  
**Custom Domain**: `www.xtend-ai.com`  
**Azure SWA Hostname**: `gentle-sea-0d684ea10.2.azurestaticapps.net`

> Purpose: This document is the source of truth for building the Xtend-AI corporate site. Follow it closely (no invented messaging, no extra pages unless asked).

---

## 0) Primary Goals (do not drift)

Build a clean, mobile-first, high-trust corporate website that:

- clearly explains **what Xtend-AI is**
- highlights the flagship product **My AI Bartender**
- establishes credibility for a new company
- provides a simple way to contact Xtend-AI

Secondary goal: create a flexible structure to add future products (Beauty/Cosmetics, Wine connoisseur) without redesigning the site.

---

## 1) Positioning (APPROVED)

Use this exact copy (Home + About):

> Xtend-AI creates AI companion apps that extend what you can do — helping users discover, create, and share in the real world through friendly, capable mobile experiences.

---

## 2) Tagline (APPROVED)

Use this exact tagline (header/hero/footer as appropriate):

> Your next favorite app, made smarter

---

## 3) Navigation / Sitemap (APPROVED)

Top navigation:

1. Home
2. Products
   - My AI Bartender
   - Coming Soon (Beauty/Cosmetics, Wine)
3. About
4. Support
5. Contact
6. Privacy
7. Terms

Footer should repeat primary nav + legal links.

---

## 4) Home Page Content (Approved Sections)

### 4.1 Hero (OWNER WILL TWEAK — KEEP FLEXIBLE)

**H1 (draft):** AI-powered mobile apps that feel personal.  
**Subheadline (draft):** Xtend-AI builds consumer mobile apps that blend chat, voice, and camera intelligence to help people discover, create, and share—starting with My AI Bartender.  
**Primary CTA:** Explore Our Apps  
**Secondary CTA:** Contact Xtend-AI

> NOTE: Gene will refine the Hero copy later. Keep layout flexible.

---

### 4.2 Section: What we do (APPROVED)

**Headline:** Built mobile-first. Powered by AI.  
**Body:**  
Xtend-AI creates B2C mobile apps for people who love discovering new experiences — whether that’s crafting cocktails, exploring beauty routines, or learning wine. We focus on products where AI improves the experience through conversation, scanning, and creative help — not complexity.

---

### 4.3 Section: Featured product (APPROVED)

**Headline:** My AI Bartender  
**Body:**  
Your personal AI bartender that helps you discover cocktails, make smarter substitutions, and use what you already have. Chat with your bartender, talk hands-free, scan your home bar, and refine your own creations.

**Feature bullets:**

- **Chat:** Ask for cocktails, ideas, substitutions, and step-by-step help.
- **Voice:** Real-time voice bartender conversations (hands-free).
- **Scanner:** Use your camera to identify bottles and build “My Bar.”
- **Create:** Build your own recipe and get AI suggestions to improve it.
- **Share:** Share recipes with friends using simple codes/links.

**CTA:** Learn about My AI Bartender

---

### 4.4 Section: Why we’re different (APPROVED)

**Headline:** We don’t build “AI features.” We build AI experiences.  
**Cards (3):**

1. **Multi-modal by design** (voice + chat + camera)  
2. **Purpose-built, not generic** (each app is domain-focused)  
3. **Human UX first** (AI should feel natural and fast)

---

### 4.5 Section: What’s next (APPROVED)

**Headline:** More AI-enabled apps are on the way  
**Body:**  
We’re building new mobile experiences in **beauty/cosmetics** and **wine discovery** — designed with the same principles: excellent UX, practical AI, and user-first experiences.

**CTA:** Contact Xtend-AI (or “Join updates” if email capture is added later)

---

### 4.6 Footer microcopy (APPROVED)

**Xtend-AI** — AI-powered mobile experiences for consumers.  
Links: Products • About • Support • Contact • Privacy • Terms

---

## 5) Products Page (Structure Guidance)

### 5.1 My AI Bartender (featured)

- Hero: name + short description + CTA (store links later)
- “How it works” (4 steps):  
  1) Build “My Bar”  
  2) Ask the bartender  
  3) Create & refine  
  4) Share with friends
- “Key features” grid (Chat, Voice, Scanner, Recipe Vault, Create Studio, Friends via Code)
- Responsible use note (21+)

### 5.2 Coming Soon (future products)

- Beauty/Cosmetics app: 2–3 lines (placeholder)
- Wine connoisseur app: 2–3 lines (placeholder)
- CTA: Contact for partnership/updates

---

## 6) About Page (use approved positioning)

Structure:

- H1: About Xtend-AI
- 1–2 paragraphs using the approved positioning statement (section 1)
- Values list (bullet):
  - User experience comes first
  - AI should be helpful, not hype
  - Build for trust and simplicity
  - Iterate fast, polish hard

---

## 7) Support Page

Simple credible support page:

- Short “how to get help” copy
- Support email (owner to provide)
- Optional FAQ (can be placeholders)

---

## 8) Contact Page

- Contact form (Name optional, Email required, Message required)
- If form is not ready: mailto link as interim

---

## 9) Brand / Design System (Implementation Guidance)

### 9.1 Color palette (from logo)

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

### 9.2 Typography

Preferred:

* Headings: **Sora** (600–700)

* Body: **Inter** (400–500)

Fallback (no external fonts):

* `system-ui, -apple-system, Segoe UI, Roboto, Arial, sans-serif`

### 9.3 Layout & spacing

* Max content width: 1120–1200px

* 8px spacing grid

* Section padding: 72–96px desktop, 48–64px mobile

* Component radius: 12–16px

* Cards: subtle border, minimal shadow

### 9.4 Buttons

Primary CTA:

* BG `#022A56`, text white

* Hover: BG `#188CFF`, text `#00052A` (keep contrast)

Secondary CTA:

* Outline 2px `#022A56`, text `#022A56`

* Hover: very light tint background

* * *

10) Assets (Provided Separately)

--------------------------------

Preferred assets:

* Full logo (transparent)

* X mark only (for favicon/app icon)

* Wordmark only (transparent)

* Favicon bundle (`favicon.ico`)

* Optional CSS tokens file (if provided)

> If the original SVG exists, prefer SVG for the header logo (crisper than PNG).

* * *

11) Technical Requirements (Azure Static Web Apps)

--------------------------------------------------

### 11.1 Hosting / domain

* Deploy to Azure Static Web Apps

* Use SWA hostname: `gentle-sea-0d684ea10.2.azurestaticapps.net`

* Ensure custom domain mapping for `www.xtend-ai.com`

### 11.2 Performance & quality gates

* Mobile-first responsive layout

* Lighthouse targets: Performance ≥ 90, Accessibility ≥ 90, Best Practices ≥ 90, SEO ≥ 90

* Minimal client JS (keep it fast)

* Optimize images (WebP/AVIF), lazy-load below fold

### 11.3 SEO essentials

* Unique title + meta description per page

* OpenGraph tags for share previews

* `sitemap.xml` + `robots.txt`

* Canonical URLs

* * *

12) Contact Form Implementation Options (choose one)

----------------------------------------------------

Option A (Azure-native, recommended):

* SWA + Azure Function (HTTP) as form endpoint

* Function forwards to email (SendGrid) OR stores in Azure Table/Queue

* Basic anti-spam (honeypot + rate limit)

Option B (fastest):

* Use a reputable hosted form provider (site stays static)

Option C (temporary):

* mailto link only

* * *

13) Implementation Rules (for Claude Code / developer)

------------------------------------------------------

* Don’t invent new claims or messaging beyond this document.

* Keep the visual style aligned to the logo: white space + navy text + blue accents.

* Use a simple static stack (Astro / Next static export / Vite / plain HTML).

* Keep repo structure clean:
  
  * `/src` for pages/components
  
  * `/public` for assets
  
  * `/docs` for docs like this

Deliverables:

* Working site deployed to Azure SWA

* Source repo with build instructions

* README: local dev + build + deploy steps

* * *

14) Open Items (Owner will provide)

-----------------------------------

* Support email address

* Contact form destination decision (Option A/B/C)

* App store links (when available)

* Screenshots for My AI Bartender (optional but recommended)
