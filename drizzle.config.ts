import { existsSync } from 'node:fs';
import { defineConfig } from 'drizzle-kit';

// Corre fuera de Astro. Una variable ya definida en la terminal gana sobre .env.
if (existsSync('.env')) process.loadEnvFile();

export default defineConfig({
  dialect: 'postgresql',
  schema: './src/lib/schema/*.ts',
  out: './drizzle',
  dbCredentials: { url: process.env.DATABASE_URL! },
});
