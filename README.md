# Xtend-AI Website

Corporate marketing website for Xtend-AI, built with Astro and deployed to Azure Static Web Apps.

## Tech Stack

- **Framework**: Astro 5.x
- **Styling**: Vanilla CSS with custom properties
- **Fonts**: Sora (headings) + Inter (body) — self-hosted variable woff2 in `public/fonts/`, no Google Fonts request
- **Contact Form**: Azure Functions + SendGrid
- **Hosting**: Azure Static Web Apps

## Development

### Prerequisites

- Node.js 18+
- npm or yarn
- ffmpeg and ffprobe on PATH, **only** to regenerate the ambient video loops with `node scripts/make-ambient-video.mjs`. `npm run build` never needs them.

### Local Development

```bash
# Install dependencies
npm install

# Start dev server
npm run dev
```

The site will be available at `http://localhost:4321`

Page URLs use the trailing-slash form (`/services/`). Astro runs with `trailingSlash: 'always'`, so `http://localhost:4321/services` answers 404 in dev and in `npm run preview`; that is the convention being enforced, not a broken page. Unknown paths render `src/pages/404.astro` (preview serves it with a real 404 status).

### Build

```bash
npm run build
```

Output is generated in the `dist/` directory.

### Preview Production Build

```bash
npm run preview
```

## Project Structure

```
├── src/
│   ├── layouts/          # Page layouts
│   ├── components/       # Reusable components
│   ├── pages/            # Route pages
│   ├── styles/           # Global styles
│   └── assets/           # Images optimized by astro:assets at build time
├── public/               # Static assets served as-is
├── api/                  # Azure Functions
├── scripts/              # Derived-asset generators (reverse logo, favicons, OG card, ambient video loops) — run manually, outputs committed
└── docs/                 # Documentation
```

Asset convention: images rendered via Astro's `<Image>` component live in `src/assets/` so the build pipeline can generate sized, format-modernized variants (WebP, density-aware `srcset`). Use `public/` only for files that must be served at a fixed URL with no processing (favicons, `robots.txt`, sitemaps, etc.).

## Deployment

The site deploys automatically via GitHub Actions when changes are pushed to the main branch.

### Environment Variables

Set these in Azure Static Web Apps configuration:

| Variable | Description |
|----------|-------------|
| `SENDGRID_API_KEY` | SendGrid API key for contact form |

## Contact Form & Email Configuration

The website uses SendGrid for the contact form on the Contact page. Form submissions are sent to `xtendai@xtend-ai.com`.

The form includes a required **interest selector** (*New website / Mobile app / Cloud & hosting / Support / Something else*) that qualifies leads on arrival: the chosen value is carried into the email subject — `[Xtend-AI Contact] New website — Jane Smith` — and shown as a row in the body. The option strings live in **two files that must stay in step**: `src/pages/contact.astro` (renders the `<select>`) and `api/contact/index.js` (the `INTERESTS` allow-list; only allow-listed values reach the subject line). Submissions without an interest value still send, using the older generic subject.

### Email Addresses

| Page | Email | Purpose |
|------|-------|---------|
| Contact | xtendai@xtend-ai.com | General inquiries, contact form destination |
| Support | support@xtend-ai.com | Customer support, bug reports |
| Terms | xtendai@xtend-ai.com | Legal inquiries |
| Privacy | xtendai@xtend-ai.com | Privacy inquiries |

### SendGrid Setup

1. Create a SendGrid account at https://sendgrid.com
2. Create a Sender Identity for `xtendai@xtend-ai.com` and verify it
3. Create an API key with "Mail Send" permission (or Full Access)
4. Add the API key to Azure SWA environment variables as `SENDGRID_API_KEY`

The contact form API is located at `api/contact/index.js` and sends emails using the verified sender address.

## Domain

- **Production**: https://www.xtend-ai.com (the SWA default domain once the owner sets it in the portal under Custom domains; the apex `xtend-ai.com` and the SWA hostname then answer 301 to it)
- **Azure SWA**: https://gentle-sea-0d684ea10.2.azurestaticapps.net (serves the same deployment until the default domain is set)

URLs are the trailing-slash form (`/services/`); SWA 301s the slash-less form, unknown paths answer 404 with `src/pages/404.astro`, and `staticwebapp.config.json` changes go through a pull request so the staging environment can be checked first (`docs/IMPLEMENTATION.md`, *Redirects, trailing slashes and the 404 page*).

## Search presence

Set up per the SEO plan of 2026-10-07; these are owner tasks and `XTEND-AI-WEB.md` §17 records which are done:

- **Google Search Console**: a Domain property for `xtend-ai.com`, verified with a TXT record in the Azure DNS zone (the zone's name servers are Azure DNS), with `https://www.xtend-ai.com/sitemap-index.xml` submitted. Measurement for the site comes from here; the site runs no analytics script.
- **Bing Webmaster Tools**: imported from Search Console.
- **Google Business Profile**: a service-area listing (address hidden) with the same name, phone number (704-957-7466) and website as the site; Bing Places and Apple Business Connect are imported from it.
- **After every deploy**: an unknown path must return 404 and `/about` must 301 to `/about/` (commands in `.claude/CLAUDE.md`).

## Documentation

- `XTEND-AI-WEB.md` — product brief: positioning, sitemap, page content, brand spec
- `docs/IMPLEMENTATION.md` — engineering reference: design tokens, asset pipeline, Astro patterns, deployment quirks
- `XTEND-AI_WEB_BRIEF.md` — original brand-asset handoff notes
- `PRIVACY_POLICY.md` — privacy policy content
- `services.md` — My AI Bartender terms of service content
