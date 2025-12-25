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
│   └── styles/           # Global styles
├── public/               # Static assets
├── api/                  # Azure Functions
└── docs/                 # Documentation
```

## Deployment

The site deploys automatically via GitHub Actions when changes are pushed to the main branch.

### Environment Variables

Set these in Azure Static Web Apps configuration:

| Variable | Description |
|----------|-------------|
| `SENDGRID_API_KEY` | SendGrid API key for contact form |

## SendGrid Setup

1. Create a SendGrid account at https://sendgrid.com
2. Verify sender identity for `noreply@xtend-ai.com`
3. Create an API key with "Mail Send" permission
4. Add the API key to Azure SWA environment variables

## Domain

- **Production**: https://www.xtend-ai.com
- **Azure SWA**: https://gentle-sea-0d684ea10.2.azurestaticapps.net
