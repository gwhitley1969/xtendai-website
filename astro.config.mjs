import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';

export default defineConfig({
  site: 'https://www.xtend-ai.com',
  output: 'static',
  integrations: [sitemap()],
  build: {
    assets: 'assets'
  }
});
