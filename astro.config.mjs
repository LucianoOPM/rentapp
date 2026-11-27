// @ts-check
import { defineConfig } from 'astro/config';

import react from '@astrojs/react';
import tailwindcss from '@tailwindcss/vite';
import netlify from '@astrojs/netlify';

// https://astro.build/config
export default defineConfig({
  output: 'server',
  integrations: [react()],

  vite: {
    plugins: [tailwindcss()]
  },

  // No usamos Edge Functions; su emulador falla con Deno 2.9.8 (--allow-scripts).
  adapter: netlify({ devFeatures: { edgeFunctions: false, images: true, environmentVariables: false } })
});
