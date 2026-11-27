import { defineMiddleware } from 'astro:middleware';
import { applyAuthCookies } from '@lib/auth-cookies';
import { authService } from '@lib/container';
import { accessRedirect } from '@lib/route-access';

// Protege rutas, no Actions: cada Action revisa sus propios permisos.
export const onRequest = defineMiddleware(async (context, next) => {
  context.locals.user = null;
  // Better Auth lee y renueva la sesión por su cuenta en sus endpoints.
  if (context.routePattern === '/api/auth/[...all]') return next();

  const { headers, response } = await authService.resolveSession(context.request.headers);
  // Va antes de `next()`: si una Action cambia la cookie, la suya gana.
  applyAuthCookies(headers, context.cookies);
  context.locals.user = response?.user ?? null;

  const target = accessRedirect(context.routePattern, context.locals.user);
  return target ? context.redirect(target) : next();
});
