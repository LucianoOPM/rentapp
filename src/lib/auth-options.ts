// Sin conexión a la base: la CLI de Better Auth carga este archivo fuera de Astro.
import type { BetterAuthOptions } from 'better-auth';
import { username } from 'better-auth/plugins';

export const authOptions = {
  plugins: [username()],
  advanced: { database: { generateId: 'serial' } },
  user: {
    additionalFields: {
      role: { type: ['admin', 'renter'], defaultValue: 'renter', input: false },
      phone: { type: 'string', required: false },
      mustChangePassword: { type: 'boolean', defaultValue: true, input: false },
    },
  },
} satisfies BetterAuthOptions;
