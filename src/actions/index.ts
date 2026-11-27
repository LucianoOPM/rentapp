import { ActionError, defineAction } from 'astro:actions';
import { z } from 'astro/zod';
import { APIError } from 'better-auth/api';
import { auth, changeOwnPassword } from '@lib/auth';
import { applyAuthCookies } from '@lib/auth-cookies';
import { changePasswordInput } from '@lib/password-rules';

const unexpected = (error: unknown) => {
  console.error(error);
  return new ActionError({ code: 'INTERNAL_SERVER_ERROR', message: 'Algo falló. Inténtalo de nuevo.' });
};

const required = (message: string) => z.string({ error: message }).min(1, message);

export const server = {
  login: defineAction({
    accept: 'form',
    input: z.object({
      username: required('Escribe tu usuario.'),
      password: required('Escribe tu contraseña.'),
    }),
    handler: async (input, context) => {
      try {
        const { headers } = await auth.api.signInUsername({
          body: input,
          headers: context.request.headers,
          returnHeaders: true,
        });
        applyAuthCookies(headers, context.cookies);
        // La respuesta del acceso no tipa los campos propios; se leen de la sesión recién creada.
        const cookie = headers.getSetCookie().map((c) => c.split(';')[0]).join('; ');
        const session = await auth.api.getSession({ headers: new Headers({ cookie }) });
        if (!session) throw new Error('La sesión recién creada no se pudo leer');
        return { mustChangePassword: session.user.mustChangePassword === true };
      } catch (error) {
        if (error instanceof APIError && error.statusCode < 500) {
          throw new ActionError({ code: 'UNAUTHORIZED', message: 'Usuario o contraseña incorrectos.' });
        }
        throw unexpected(error);
      }
    },
  }),

  changePassword: defineAction({
    accept: 'form',
    input: changePasswordInput,
    handler: async ({ currentPassword, newPassword }, context) => {
      try {
        const headers = await changeOwnPassword(context.request.headers, currentPassword, newPassword);
        applyAuthCookies(headers, context.cookies);
      } catch (error) {
        if (error instanceof APIError && error.body?.code === 'INVALID_PASSWORD') {
          throw new ActionError({ code: 'BAD_REQUEST', message: 'La contraseña actual no es correcta.' });
        }
        if (error instanceof APIError && error.statusCode === 401) {
          throw new ActionError({ code: 'UNAUTHORIZED', message: 'Tu sesión terminó. Vuelve a entrar.' });
        }
        throw unexpected(error);
      }
    },
  }),

  logout: defineAction({
    accept: 'form',
    handler: async (_input, context) => {
      try {
        const { headers } = await auth.api.signOut({ headers: context.request.headers, returnHeaders: true });
        applyAuthCookies(headers, context.cookies);
      } catch (error) {
        throw unexpected(error);
      }
    },
  }),
};
