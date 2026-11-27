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
      // min: sin él, una variable vacía pasa y `pg` usa sus valores por defecto.
      DATABASE_URL: envField.string({ context: 'server', access: 'secret', min: 1 }),
      BETTER_AUTH_SECRET: envField.string({ context: 'server', access: 'secret', min: 32 }),
      BETTER_AUTH_URL: envField.string({ context: 'server', access: 'secret', min: 1 }),
      CLOUDINARY_URL: envField.string({ context: 'server', access: 'secret', min: 1 }),
    },
  },
  integrations: [react()],

  vite: {
    plugins: [tailwindcss()]
  },

  // No usamos Edge Functions; su emulador falla con Deno 2.9.8 (--allow-scripts).
  adapter: netlify({ devFeatures: { edgeFunctions: false, images: true, environmentVariables: false } })
});
