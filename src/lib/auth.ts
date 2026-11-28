import { betterAuth } from 'better-auth';
import { drizzleAdapter } from 'better-auth/adapters/drizzle';
import { BETTER_AUTH_SECRET, BETTER_AUTH_URL } from 'astro:env/server';
import { authOptions } from '@lib/auth-options';
import { db } from '@lib/db';
import { account } from '@lib/schema/account';
import { rateLimit } from '@lib/schema/rate-limit';
import { session } from '@lib/schema/session';
import { user } from '@lib/schema/user';
import { verification } from '@lib/schema/verification';

export const auth = betterAuth({
  ...authOptions,
  database: drizzleAdapter(db, { provider: 'pg', schema: { user, session, account, verification, rateLimit } }),
  secret: BETTER_AUTH_SECRET,
  baseURL: BETTER_AUTH_URL,
});
