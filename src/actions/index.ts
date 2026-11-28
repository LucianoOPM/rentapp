import { ActionError, defineAction } from 'astro:actions';
import { APIError } from 'better-auth/api';
import { applyAuthCookies } from '@lib/auth-cookies';
import { authService } from '@lib/container';
import { changePasswordInput, loginInput } from '@lib/password-rules';
import { LoginError } from '@lib/services/auth-service';

const unexpected = (error: unknown) => {
  console.error(error);
  return new ActionError({ code: 'INTERNAL_SERVER_ERROR', message: 'Algo falló. Inténtalo de nuevo.' });
};

export const server = {
  login: defineAction({
    accept: 'form',
    input: loginInput,
    handler: async (input, context) => {
      try {
        const { headers, mustChangePassword } = await authService.login(input, context.request, context.clientAddress);
        applyAuthCookies(headers, context.cookies);
        return { mustChangePassword };
      } catch (error) {
        if (error instanceof LoginError && error.status === 429) {
          throw new ActionError({
            code: 'TOO_MANY_REQUESTS',
            message: 'Demasiados intentos. Espera un minuto e inténtalo de nuevo.',
          });
        }
        if (error instanceof LoginError && error.isBadCredentials) {
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
        const headers = await authService.changeOwnPassword(context.request.headers, currentPassword, newPassword);
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
        const headers = await authService.logout(context.request.headers);
        applyAuthCookies(headers, context.cookies);
      } catch (error) {
        throw unexpected(error);
      }
    },
  }),
};
