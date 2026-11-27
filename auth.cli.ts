// Solo para la CLI de Better Auth (generar el esquema). La app no lo importa.
import { betterAuth } from 'better-auth';
import { authOptions } from './src/lib/auth-options';

export const auth = betterAuth(authOptions);
