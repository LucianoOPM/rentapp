// Crea un usuario de prueba en la base de DATABASE_URL. Solo para desarrollo: el registro está cerrado.
import { randomBytes } from 'node:crypto';
import { existsSync } from 'node:fs';
import { createInterface } from 'node:readline/promises';
import { betterAuth } from 'better-auth';
import { drizzleAdapter } from 'better-auth/adapters/drizzle';
import { drizzle } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';
import { authOptions } from '../src/lib/auth-options.ts';
import * as schema from '../src/lib/schema/auth.ts';

if (existsSync('.env')) process.loadEnvFile();
if (!process.env.DATABASE_URL) throw new Error('Falta DATABASE_URL');

const [usuario, password] = process.argv.slice(2);
// internalAdapter no valida el largo de la contraseña.
if (!usuario || !password || password.length < 8) {
  console.error('Uso: node scripts/create-test-user.mjs <usuario> <contraseña de 8 caracteres o más>');
  process.exit(1);
}

const rl = createInterface({ input: process.stdin, output: process.stdout });
console.log(`Base de datos: ${new URL(process.env.DATABASE_URL).host}`);
const answer = await rl.question('¿Es la rama dev? Escribe "si" para crear el usuario: ');
rl.close();
if (answer.trim() !== 'si') {
  console.log('No se creó nada.');
  process.exit(0);
}

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
try {
  const auth = betterAuth({
    ...authOptions,
    database: drizzleAdapter(drizzle(pool), { provider: 'pg', schema }),
    secret: randomBytes(32).toString('base64'),
  });
  const ctx = await auth.$context;
  const user = await ctx.internalAdapter.createUser(
    { name: usuario, username: usuario, email: `${usuario.toLowerCase()}@sin-correo.invalid`, emailVerified: false },
    { method: 'email-password' },
  );
  await ctx.internalAdapter.linkAccount({
    userId: user.id,
    providerId: 'credential',
    accountId: String(user.id),
    password: await ctx.password.hash(password),
  });
  console.log(`Usuario "${usuario}" creado. Se le pedirá cambiar la contraseña al entrar.`);
} finally {
  await pool.end();
}
