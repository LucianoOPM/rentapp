import { drizzle } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';
import { DATABASE_URL } from 'astro:env/server';
import * as schema from './schema/auth';

export const db = drizzle(new Pool({ connectionString: DATABASE_URL }), { schema });
