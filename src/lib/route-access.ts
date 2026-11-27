// Sin imports: se prueba con `node --test`.
export type AccessUser = { role?: string | null; mustChangePassword?: boolean | null };

const within = (route: string, base: string) => route === base || route.startsWith(`${base}/`);

/** A dónde redirigir según la ruta resuelta (`context.routePattern`), o `null` si puede pasar. */
export function accessRedirect(route: string, user: AccessUser | null): string | null {
  const area = ['/admin', '/app'].find((base) => within(route, base));
  if (!area && route !== '/' && route !== '/cambiar-contrasena') return null;
  if (!user) return '/login';
  if (route === '/cambiar-contrasena') return null;
  if (user.mustChangePassword) return '/cambiar-contrasena';
  const home = user.role === 'admin' ? '/admin' : '/app';
  return area === home ? null : home;
}
