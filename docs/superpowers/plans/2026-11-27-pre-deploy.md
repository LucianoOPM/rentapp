# Antes del primer despliegue: plan de implementación

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Poner límite de intentos a `/login` y mostrar los departamentos en `/admin`.

**Architecture:** `AuthService.login` pasa de `auth.api` a `auth.handler`, que sí aplica el límite de Better Auth, guardado en una tabla nueva. La lista sigue `página → UnitService → UnitRepository`.

**Tech Stack:** Astro 7, Better Auth 1.7.28, Drizzle, PostgreSQL (rama `dev` de Neon), `node --test`.

**Spec:** [docs/superpowers/specs/2026-11-27-pre-deploy-design.md](../specs/2026-11-27-pre-deploy-design.md)

## Global Constraints

- pnpm y Node 24; sin dependencias nuevas.
- Sin funciones exclusivas de Netlify. La IP sale de `context.clientAddress`.
- En `src/`, imports con alias `@`. En los archivos que prueba `node --test`: sin *parameter properties* ni `enum`, y dependencias con `import type`.
- Textos en español, tuteando. Los formularios funcionan sin JavaScript.
- Antes de cerrar cada tarea: `pnpm check`, `pnpm build` y `node --test tests/*.test.mjs` pasan.
- Commits en Conventional Commits, en `feat/previo-al-despliegue`. La PR va contra `dev`.
- Las migraciones solo se aplican a `dev`. Antes, confirma que la `DATABASE_URL` activa no sea la de producción y que la terminal no la tenga ya definida. No toques `production`.

## Review Focus

- El navegador manda su propio `x-client-ip` (al formulario o a `/api/auth/sign-in/username`): se reemplaza. Prueba en la tarea 1.
- Contraseña correcta después de 5 fallos seguidos: muestra el mensaje de límite, no "incorrectos". Prueba manual en la tarea 1.
- Pasada la ventana de 60 s sin intentos aceptados, se puede volver a entrar. Prueba manual en la tarea 1.
- La base falla durante el acceso (5xx): mensaje genérico, no "incorrectos". Prueba en la tarea 1.
- Formulario sin JavaScript: el acceso conserva la cookie y los mensajes se ven. Prueba manual en la tarea 1.

---

### Task 1: Límite de intentos en el acceso

**Files:**
- Create: `src/lib/schema/rate-limit.ts`, `drizzle/0002_add-rate-limit.sql` (generada)
- Modify: `src/lib/auth-options.ts`, `src/lib/auth.ts`, `src/lib/db.ts`, `src/lib/services/auth-service.ts`, `src/actions/index.ts`, `src/pages/api/auth/[...all].ts`, `docs/architecture.md`, `docs/data-model.md`, `docs/security.md`, `docs/open-questions.md`
- Test: `tests/auth-service.test.mjs`

**Interfaces:**
- Produces, en `auth-service.ts`:
  - `export class LoginError extends Error { readonly status: number }`
  - `login(credentials: { username: string; password: string }, request: Request, clientIp: string): Promise<{ headers: Headers; mustChangePassword: boolean }>`
  - `handle(request: Request, clientIp: string): Promise<Response>`

- [ ] **Step 1: Escribe las pruebas que fallan**

`setup(api, handler)` pasa `{ api, handler }` al servicio. Las dos pruebas actuales de `login` usan un `handler` falso en lugar de `signInUsername`, con `new Request('http://localhost:4321/_actions/login', { method: 'POST' })` e IP `'203.0.113.7'`. Agrega:

```js
const form = () =>
  new Request('http://localhost:4321/_actions/login', {
    method: 'POST',
    headers: { 'x-client-ip': '1.1.1.1', origin: 'http://localhost:4321', 'content-type': 'application/x-www-form-urlencoded', 'content-length': '999' },
  });

test('login pide el acceso al handler y reemplaza la IP que mande el cliente', async () => {
  let sent;
  const { service } = setup(
    { getSession: async () => ({ user: { mustChangePassword: false } }) },
    async (request) => {
      sent = request;
      return new Response('{}', { headers: withCookie() });
    },
  );
  await service.login({ username: 'prueba', password: 'temporal-1' }, form(), '203.0.113.7');
  assert.equal(sent.method, 'POST');
  assert.equal(sent.url, 'http://localhost:4321/api/auth/sign-in/username');
  assert.equal(sent.headers.get('x-client-ip'), '203.0.113.7');
  assert.equal(sent.headers.get('origin'), 'http://localhost:4321');
  assert.equal(sent.headers.get('content-type'), 'application/json');
  assert.equal(sent.headers.get('content-length'), null);
  assert.deepEqual(await sent.json(), { username: 'prueba', password: 'temporal-1' });
});

for (const status of [401, 429, 500]) {
  test(`login falla con LoginError ${status}`, async () => {
    const { service } = setup({}, async () => new Response('{}', { status }));
    await assert.rejects(
      service.login({ username: 'prueba', password: 'mala' }, form(), '203.0.113.7'),
      (error) => error instanceof LoginError && error.status === status,
    );
  });
}

test('handle reemplaza la IP en las peticiones HTTP de Better Auth', async () => {
  let sent;
  const { service } = setup({}, async (request) => {
    sent = request;
    return new Response();
  });
  await service.handle(form(), '203.0.113.7');
  assert.equal(sent.headers.get('x-client-ip'), '203.0.113.7');
});
```

- [ ] **Step 2: Comprueba que fallan**

Run: `node --test tests/auth-service.test.mjs`
Expected: FAIL (no existe `LoginError`).

- [ ] **Step 3: Cambia `AuthService`**

`login` arma la petición con una copia de `request.headers`, sin `content-length`, con `content-type: application/json` y `x-client-ip` puesto con `set`. La URL es `new URL('/api/auth/sign-in/username', request.url)`. Si la respuesta no es `ok`, lanza `LoginError`. La lectura de la sesión nueva queda igual. `handle` también pone el header con `set` en una copia de la petición, sin perder el cuerpo.

- [ ] **Step 4: Conecta los controladores**

- `login` en `src/actions/index.ts` llama a `authService.login(input, context.request, context.clientAddress)`. `LoginError` 429 → `ActionError` `TOO_MANY_REQUESTS`, "Demasiados intentos. Espera un minuto e inténtalo de nuevo."; otro 4xx → `UNAUTHORIZED`, "Usuario o contraseña incorrectos."; lo demás → `unexpected(error)`. `changePassword` no cambia.
- El endpoint: `({ request, clientAddress }) => authService.handle(request, clientAddress)`.
- `src/pages/login.astro` ya muestra `error.message`; no cambia.

- [ ] **Step 5: Configura el límite**

En `authOptions`:

```ts
rateLimit: {
  enabled: true,
  storage: 'database',
  customRules: { '/sign-in/username': { window: 60, max: 5 } },
},
advanced: { database: { generateId: 'serial' }, ipAddress: { ipAddressHeaders: ['x-client-ip'] } },
```

Agrega `'/sign-in/email'` a `disabledPaths` y quita el comentario `shortcut:` de `auth.ts`.

- [ ] **Step 6: Crea la tabla**

`src/lib/schema/rate-limit.ts` exporta `rateLimit` (tabla `rate_limit`) y sus tipos `RateLimit` y `NewRateLimit`: `id: id()`, `key` texto único y obligatorio, `count` entero obligatorio, `lastRequest` `bigint('last_request', { mode: 'number' })` obligatorio. Los nombres de las propiedades deben ser esos: Better Auth los busca así. Agrégala a `db.ts` y al `schema` del `drizzleAdapter` en `auth.ts`.

Run: `pnpm db:generate --name=add-rate-limit`
Expected: `drizzle/0002_add-rate-limit.sql` solo crea `rate_limit`.

- [ ] **Step 7: Verifica**

Run: `node --test tests/*.test.mjs`, `pnpm check`, `pnpm build`
Expected: todo pasa, 0 errores.

- [ ] **Step 8: Prueba en `dev`**

Con la comprobación de Global Constraints hecha: `pnpm db:migrate` y `pnpm dev`. Para entrar hace falta una cuenta cuya contraseña conozca la persona usuaria; ella la escribe (o se crea un usuario de prueba con `scripts/create-test-user.mjs`).

Comprueba, también con JavaScript desactivado: el acceso correcto entra; tras 5 intentos fallidos, el sexto muestra el mensaje de límite aun con la contraseña correcta; 60 s después del último intento aceptado vuelve a entrar. En `rate_limit` la clave es `<ip>|/sign-in/username`, no `no-trusted-ip`. Prueba `POST /api/auth/sign-in/email`: 404.

- [ ] **Step 9: Actualiza la documentación**

- `architecture.md`, sección Acceso: el acceso usa `auth.handler` por el límite (5 por IP, ventana de 60 s, en la tabla `rate_limit`) y `/api/auth/sign-in/email` está desactivada.
- `data-model.md`: la tabla `rate_limit`, junto a las demás tablas de Better Auth.
- `security.md`: el límite y que no frena ataques desde muchas IP.
- `open-questions.md`: quita "Límite de intentos".

- [ ] **Step 10: Commit**

```bash
git add src tests drizzle docs/architecture.md docs/data-model.md docs/security.md docs/open-questions.md
git commit -m "feat: limitar los intentos de acceso"
```

---

### Task 2: Lista de departamentos en `/admin`

**Files:**
- Create: `src/lib/repositories/unit-repository.ts`, `src/lib/services/unit-service.ts`
- Modify: `src/lib/container.ts`, `src/pages/admin/index.astro`, `README.md`, `CLAUDE.md`

**Interfaces:**
- Produces: `UnitRepository.findAll(): Promise<{ name: string }[]>` (implementada por `DrizzleUnitRepository`, ordenada por `sortOrder`), `UnitService.list()` y `unitService` en `container.ts`.

El servicio solo delega y el orden es de la consulta, así que no lleva prueba unitaria: se comprueba en `dev`.

- [ ] **Step 1: Repositorio, servicio y composición**, con el patrón de `user-repository.ts` y `lease-service.ts`. La consulta selecciona solo `name` (nada de WiFi ni notas).

- [ ] **Step 2: Página.** En `admin/index.astro`, bajo el saludo, un `<h2>` "Departamentos" y una `<ul>` con los nombres. Sin revisión de rol nueva: la ruta ya la protege el middleware.

- [ ] **Step 3: Verifica**

Run: `node --test tests/*.test.mjs`, `pnpm check`, `pnpm build`
Expected: todo pasa, 0 errores.

En `dev`, con sesión de `admin`: `/admin` muestra "Departamento 1", "Departamento 2" y "Departamento 3", en ese orden. Sin sesión redirige a `/login`.

- [ ] **Step 4: Actualiza el estado** en `README.md`, `CLAUDE.md`, y las notas iniciales de `docs/architecture.md` y `docs/security.md`: `/admin` ya lista los departamentos. El punto 8 del roadmap sigue sin marcar.

- [ ] **Step 5: Commit**

```bash
git add src README.md CLAUDE.md docs/architecture.md docs/security.md
git commit -m "feat: mostrar los departamentos en el panel"
```

---

## Después de este plan

Despliegue en Netlify y respaldo. `pnpm db:migrate` en `production` va **antes** de desplegar: sin la tabla `rate_limit`, el acceso falla.
