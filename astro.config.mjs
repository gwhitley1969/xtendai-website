import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';

export default defineConfig({
  site: 'https://www.xtend-ai.com',
  output: 'static',
  // Canonical URLs are the directory form with a trailing slash (/about/);
  // SWA 301s the slash-less form (staticwebapp.config.json "trailingSlash").
  // Dev and preview answer 404 for slash-less page URLs by design, so a
  // stray /about link fails locally instead of in production.
  trailingSlash: 'always',
  integrations: [sitemap()],
  build: {
    assets: 'assets'
  }
});
