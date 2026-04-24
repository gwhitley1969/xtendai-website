# Xtend-AI Website

Corporate marketing website for Xtend-AI, built with Astro and deployed to Azure Static Web Apps.

## Tech Stack

- **Framework**: Astro 5.x
- **Styling**: Vanilla CSS with custom properties
- **Fonts**: Sora (headings) + Inter (body)
- **Contact Form**: Azure Functions + SendGrid
- **Hosting**: Azure Static Web Apps

## Development

### Prerequisites

- Node.js 18+
- npm or yarn

### Local Development

```bash
# Install dependencies
npm install

# Start dev server
npm run dev
```

The site will be available at `http://localhost:4321`

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

- **Production**: https://www.xtend-ai.com
- **Azure SWA**: https://gentle-sea-0d684ea10.2.azurestaticapps.net

## Documentation

- `XTEND-AI-WEB.md` — product brief: positioning, sitemap, page content, brand spec
- `docs/IMPLEMENTATION.md` — engineering reference: design tokens, asset pipeline, Astro patterns, deployment quirks
- `XTEND-AI_WEB_BRIEF.md` — original brand-asset handoff notes
- `PRIVACY_POLICY.md` — privacy policy content
- `services.md` — My AI Bartender terms of service content
