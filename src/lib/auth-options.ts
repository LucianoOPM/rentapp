// Sin conexión a la base: la CLI de Better Auth y el script de usuarios lo cargan fuera de Astro.
import type { BetterAuthOptions } from 'better-auth';
import { username } from 'better-auth/plugins';

export const authOptions = {
  plugins: [username()],
  advanced: { database: { generateId: 'serial' } },
  emailAndPassword: { enabled: true, disableSignUp: true, minPasswordLength: 8 },
  // Solo afecta a HTTP. El cambio de contraseña pasa por la app para actualizar `mustChangePassword`.
  disabledPaths: ['/change-password', '/update-user', '/is-username-available'],
  user: {
    additionalFields: {
      role: { type: ['admin', 'renter'], defaultValue: 'renter', input: false },
      phone: { type: 'string', required: false },
      mustChangePassword: { type: 'boolean', defaultValue: true, input: false },
    },
  },
} satisfies BetterAuthOptions;
