import { betterAuth } from 'better-auth';
import { drizzleAdapter } from 'better-auth/adapters/drizzle';
import { eq } from 'drizzle-orm';
import { BETTER_AUTH_SECRET, BETTER_AUTH_URL } from 'astro:env/server';
import { authOptions } from './auth-options';
import { db } from './db';
import * as schema from './schema/auth';

// shortcut: auth.api no pasa por el límite de intentos de Better Auth; resolver antes del primer despliegue.
export const auth = betterAuth({
  ...authOptions,
  database: drizzleAdapter(db, { provider: 'pg', schema }),
  secret: BETTER_AUTH_SECRET,
  baseURL: BETTER_AUTH_URL,
});

/** Devuelve los headers con la cookie de la sesión nueva; las anteriores quedan cerradas. */
export async function changeOwnPassword(headers: Headers, currentPassword: string, newPassword: string) {
  const result = await auth.api.changePassword({
    body: { currentPassword, newPassword, revokeOtherSessions: true },
    headers,
    returnHeaders: true,
  });
  // Si esto falla, la marca sigue activa y se vuelve a pedir el cambio.
  await db
    .update(schema.user)
    .set({ mustChangePassword: false })
    .where(eq(schema.user.id, Number(result.response.user.id)));
  return result.headers;
}
