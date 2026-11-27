// @ts-check
import { defineConfig, envField } from 'astro/config';

import react from '@astrojs/react';
import tailwindcss from '@tailwindcss/vite';
import netlify from '@astrojs/netlify';

// https://astro.build/config
export default defineConfig({
  output: 'server',
  env: {
    schema: {
      DATABASE_URL: envField.string({ context: 'server', access: 'secret' }),
    },
  },
  integrations: [react()],

  vite: {
    plugins: [tailwindcss()]
  },

  // No usamos Edge Functions; su emulador falla con Deno 2.9.8 (--allow-scripts).
  adapter: netlify({ devFeatures: { edgeFunctions: false, images: true, environmentVariables: false } })
});
