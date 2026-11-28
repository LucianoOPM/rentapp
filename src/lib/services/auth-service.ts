// Solo `import type`: así el servicio se prueba con `node --test`, sin Astro ni base de datos.
import type { auth } from '@lib/auth';
import type { UserRepository } from '@lib/repositories/user-repository';

export class AuthService {
  readonly #auth: Pick<typeof auth, 'api' | 'handler'>;
  readonly #users: UserRepository;

  constructor(authClient: Pick<typeof auth, 'api' | 'handler'>, users: UserRepository) {
    this.#auth = authClient;
    this.#users = users;
  }

  handle(request: Request) {
    return this.#auth.handler(request);
  }

  getSession(headers: Headers) {
    return this.#auth.api.getSession({ headers });
  }

  /** Como `getSession`, pero devuelve además los headers que renuevan o borran la cookie. */
  resolveSession(headers: Headers) {
    return this.#auth.api.getSession({ headers, returnHeaders: true });
  }

  /** Los headers devueltos traen la cookie de la sesión nueva. */
  async login(credentials: { username: string; password: string }, requestHeaders: Headers) {
    const { headers } = await this.#auth.api.signInUsername({
      body: credentials,
      headers: requestHeaders,
      returnHeaders: true,
    });
    // La respuesta del acceso no tipa los campos propios; se leen de la sesión recién creada.
    const cookie = headers.getSetCookie().map((c) => c.split(';')[0]).join('; ');
    const session = await this.getSession(new Headers({ cookie }));
    if (!session) throw new Error('La sesión recién creada no se pudo leer');
    return { headers, mustChangePassword: session.user.mustChangePassword === true };
  }

  /** Devuelve los headers con la cookie de la sesión nueva; las anteriores quedan cerradas. */
  async changeOwnPassword(requestHeaders: Headers, currentPassword: string, newPassword: string) {
    const result = await this.#auth.api.changePassword({
      body: { currentPassword, newPassword, revokeOtherSessions: true },
      headers: requestHeaders,
      returnHeaders: true,
    });
    // Si esto falla, la marca sigue activa y se vuelve a pedir el cambio.
    await this.#users.clearMustChangePassword(Number(result.response.user.id));
    return result.headers;
  }

  /** Los headers devueltos borran la cookie. */
  async logout(requestHeaders: Headers) {
    const { headers } = await this.#auth.api.signOut({ headers: requestHeaders, returnHeaders: true });
    return headers;
  }
}
