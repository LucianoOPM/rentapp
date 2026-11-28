// Sin conexión a la base: la CLI de Better Auth y el script de usuarios lo cargan fuera de Astro.
import type { BetterAuthOptions } from 'better-auth';
import { username } from 'better-auth/plugins';

export const authOptions = {
  plugins: [username()],
  // `x-client-ip` lo escribe `AuthService` con la IP que da Astro.
  advanced: { database: { generateId: 'serial' }, ipAddress: { ipAddressHeaders: ['x-client-ip'] } },
  // En memoria no sirve en funciones serverless. `enabled` explícito: por defecto solo actúa en producción.
  rateLimit: {
    enabled: true,
    storage: 'database',
    customRules: { '/sign-in/username': { window: 60, max: 5 } },
  },
  emailAndPassword: { enabled: true, disableSignUp: true, minPasswordLength: 8 },
  // Solo afecta a HTTP. El cambio de contraseña pasa por la app para actualizar `mustChangePassword`.
  // `/sign-in/email` no se usa y tendría su propio contador de intentos.
  disabledPaths: ['/change-password', '/update-user', '/is-username-available', '/sign-in/email'],
  user: {
    additionalFields: {
      role: { type: ['admin', 'renter'], defaultValue: 'renter', input: false },
      phone: { type: 'string', required: false },
      mustChangePassword: { type: 'boolean', defaultValue: true, input: false },
    },
  },
} satisfies BetterAuthOptions;
