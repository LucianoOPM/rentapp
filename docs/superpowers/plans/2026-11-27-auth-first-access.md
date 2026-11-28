# Acceso y cambio obligatorio de contraseña: plan de implementación

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Cerrar el punto 3 de la Fase 0: entrar con usuario y contraseña y pedir el cambio de la contraseña temporal en el primer acceso.

**Architecture:** Better Auth vive en `src/lib/`. Los formularios son HTML sin JavaScript que llaman a Astro Actions; estas usan `auth.api` y trasladan la cookie de sesión a `context.cookies`.

**Tech Stack:** Astro 7, Better Auth 1.7.28, Drizzle sobre `pg`, Zod (`astro/zod`), Tailwind 4, Node 24, `node:test`.

**Spec:** [diseño](../specs/2026-11-27-auth-first-access-design.md)

## Global Constraints

- Solo pnpm, Node 24. Sin dependencias ni migraciones nuevas. No usar Python.
- Formularios sin JavaScript en el navegador. No usar `Astro.session`.
- Solo `src/lib/` habla con la base.
- Sin middleware, roles, cuenta de la administradora, Netlify ni envío de correos.
- Contraseña de 8 caracteres como mínimo. Correo ficticio: `<usuario>@sin-correo.invalid`.
- Textos en español, tuteando. Una columna de 480 px como máximo, texto de 16 px, botones y campos de 44 px o más, cada campo con `<label>`.
- No leer ni imprimir el contenido de `.env`. Nunca devolver ni registrar contraseñas.
- Rama `feat/acceso-better-auth` desde `dev`, commits en Conventional Commits; la PR va contra `dev`. Sin push directo a `dev`.
- Al final de cada tarea pasan `pnpm check` y `pnpm build`.

**Antes de empezar (lo hace el usuario):** agregar a `.env` `BETTER_AUTH_URL=http://localhost:4321` y un `BETTER_AUTH_SECRET` generado con `node -e "console.log(require('node:crypto').randomBytes(32).toString('base64'))"`. Confirmar que la `DATABASE_URL` activa es la de `dev`.

## Review Focus

1. **Redirección tras cambiar la contraseña:** al revocar sesiones, la cookie que llegó con la petición deja de valer. La página debe revisar el resultado de la Action y redirigir **antes** de consultar la sesión; si no, un cambio correcto termina en `/login`. (Tarea 2, paso 7.)
2. **Campos vacíos:** en Actions de formulario llegan como `null`. Deben mostrar un mensaje en español, no el de Zod en inglés. (Tarea 2, pasos 1 y 7.)
3. **Usuario con mayúsculas** (el celular las pone solo): `Prueba` debe entrar como `prueba`; el campo lleva `autocapitalize="none"`. (Tarea 2, paso 7.)
4. **Cambio enviado sin sesión** (vencida o cerrada): lleva a `/login`, sin error 500. (Tarea 2, paso 7.)
5. **Script contra la base equivocada:** `.env` puede estar apuntando a producción. El script muestra el host y solo escribe si se confirma. (Tarea 1, paso 5.)

## Archivos

| Archivo | Responsabilidad |
| --- | --- |
| `src/lib/auth-options.ts` (modificar) | Opciones compartidas por la app, la CLI y el script |
| `src/lib/auth.ts` (crear) | Instancia de la app y cambio de contraseña con su marca |
| `src/pages/api/auth/[...all].ts` (crear) | Handler HTTP |
| `scripts/create-test-user.mjs` (crear) | Usuario de prueba en `dev` |
| `src/lib/password-rules.ts` (crear) | Validación del cambio de contraseña |
| `tests/password-rules.test.mjs` (crear) | Pruebas de esa validación |
| `src/lib/auth-cookies.ts` (crear) | Pasar los `Set-Cookie` de Better Auth a Astro |
| `src/actions/index.ts` (crear) | `login`, `changePassword`, `logout` |
| `src/layouts/Layout.astro` (crear) | HTML común de las tres páginas |
| `src/pages/login.astro`, `src/pages/cambiar-contrasena.astro` (crear), `src/pages/index.astro` (modificar) | Pantallas |

---

### Task 1: Better Auth conectado y usuario de prueba

**Files:**
- Modify: `src/lib/auth-options.ts`, `astro.config.mjs`, `.env.example`
- Create: `src/lib/auth.ts`, `src/pages/api/auth/[...all].ts`, `scripts/create-test-user.mjs`

**Interfaces:**
- Consumes: `db` de `src/lib/db.ts`; esquema de `src/lib/schema/auth.ts`.
- Produces: `auth` y `changeOwnPassword(headers: Headers, currentPassword: string, newPassword: string): Promise<Headers>` en `src/lib/auth.ts`. El `Headers` devuelto trae la cookie nueva.

- [ ] **Step 1: Opciones.** En `authOptions` agregar:

```ts
emailAndPassword: { enabled: true, disableSignUp: true, minPasswordLength: 8 },
disabledPaths: ['/change-password', '/update-user', '/is-username-available'],
```

- [ ] **Step 2: Variables.** En `env.schema` de `astro.config.mjs`, ambas `context: 'server', access: 'secret'`: `BETTER_AUTH_SECRET` con `min: 32` y `BETTER_AUTH_URL` con `min: 1`. En `.env.example`, un comentario con el valor local de la URL y el comando para generar el secreto, sin valores asignados.

- [ ] **Step 3: Instancia.** `src/lib/auth.ts`:
  - `auth = betterAuth({ ...authOptions, database: drizzleAdapter(db, { provider: 'pg', schema }), secret, baseURL })`, con `drizzleAdapter` de `better-auth/adapters/drizzle` y las variables de `astro:env/server`.
  - Sobre la instancia, el comentario `// shortcut: auth.api no pasa por el límite de intentos de Better Auth; resolver antes del primer despliegue.`
  - `changeOwnPassword` llama a `auth.api.changePassword` con `body: { currentPassword, newPassword, revokeOtherSessions: true }`, `headers` y `returnHeaders: true`. Después pone `mustChangePassword: false` con Drizzle, filtrando por `Number(response.user.id)`. El id sale de la respuesta, nunca del formulario.

- [ ] **Step 4: Endpoint.** `src/pages/api/auth/[...all].ts`: `export const ALL: APIRoute = ({ request }) => auth.handler(request);`

- [ ] **Step 5: Script.** Uso: `node scripts/create-test-user.mjs <usuario> <contraseña-temporal>`.
  - Carga `.env` y exige `DATABASE_URL` igual que `scripts/db-check.mjs`. Rechaza argumentos faltantes o una contraseña de menos de 8 caracteres (`internalAdapter` no lo valida).
  - Muestra solo el host de la base (`new URL(...).host`) y pide escribir `si` con `node:readline/promises`; cualquier otra respuesta sale sin escribir.
  - Crea su propia instancia con `authOptions` importado de `../src/lib/auth-options.ts`, el esquema de `../src/lib/schema/auth.ts` y un `secret` aleatorio (no importar `src/lib/auth.ts`: depende de `astro:env`).
  - Con `const ctx = await auth.$context`: `ctx.internalAdapter.createUser({ name: usuario, username: usuario, email: \`${usuario}@sin-correo.invalid\`, emailVerified: false }, { method: 'email-password' })`; luego `linkAccount({ userId: user.id, providerId: 'credential', accountId: String(user.id), password: await ctx.password.hash(contraseña) })`. Si el tipo del segundo argumento de `createUser` difiere en tiempo de ejecución, seguir la firma de `node_modules/better-auth/dist/db/internal-adapter.mjs`.
  - Cierra el pool en `finally`.

- [ ] **Step 6: Comprobar.**
  - `pnpm check && pnpm build && pnpm db:check`: sin errores y `Esquema correcto.`
  - Responder `no` en el script: no crea nada. Responder `si` con el usuario `prueba` y una contraseña temporal inventada: lo crea. No guardar la contraseña en el repositorio.
  - Con `pnpm dev`, enviar con `curl` y `-H "Origin: http://localhost:4321" -H "Content-Type: application/json"`:
    - `POST /api/auth/sign-up/email` con datos válidos: 400.
    - `POST /api/auth/change-password`, `POST /api/auth/update-user` y `POST /api/auth/is-username-available`: 404.
    - `POST /api/auth/sign-in/username` con `prueba`: 200 y `Set-Cookie`.

- [ ] **Step 7: Commit** `feat: conectar Better Auth y crear usuario de prueba`. Incluir el diseño y este plan en un commit `docs:` previo.

---

### Task 2: Pantallas y Actions

**Files:**
- Create: `src/lib/password-rules.ts`, `tests/password-rules.test.mjs`, `src/lib/auth-cookies.ts`, `src/actions/index.ts`, `src/layouts/Layout.astro`, `src/pages/login.astro`, `src/pages/cambiar-contrasena.astro`
- Modify: `src/pages/index.astro`

**Interfaces:**
- Consumes: `auth`, `changeOwnPassword` (Tarea 1).
- Produces:
  - `changePasswordInput`: esquema Zod con `currentPassword`, `newPassword`, `confirmPassword`.
  - `applyAuthCookies(headers: Headers, cookies: AstroCookies): void`.
  - `actions.login` devuelve `{ mustChangePassword: boolean }`; `actions.changePassword` y `actions.logout`.

- [ ] **Step 1: Prueba que falla.** `tests/password-rules.test.mjs`:

```js
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { changePasswordInput } from '../src/lib/password-rules.ts';

const ok = { currentPassword: 'temporal-1', newPassword: 'nueva-clave', confirmPassword: 'nueva-clave' };
const errorsOf = (patch) => changePasswordInput.safeParse({ ...ok, ...patch }).error?.issues.map((i) => i.message) ?? [];

test('acepta un cambio válido', () => assert.deepEqual(errorsOf({}), []));
test('rechaza menos de 8 caracteres', () =>
  assert.ok(errorsOf({ newPassword: 'corta', confirmPassword: 'corta' }).includes('La nueva contraseña debe tener al menos 8 caracteres.')));
test('rechaza una confirmación distinta', () =>
  assert.ok(errorsOf({ confirmPassword: 'otra-clave' }).includes('Las contraseñas no coinciden.')));
test('rechaza repetir la actual', () =>
  assert.ok(errorsOf({ newPassword: 'temporal-1', confirmPassword: 'temporal-1' }).includes('La nueva contraseña debe ser distinta de la actual.')));
test('pide los campos vacíos en español', () =>
  assert.ok(errorsOf({ currentPassword: null }).includes('Escribe tu contraseña actual.')));
```

- [ ] **Step 2:** `node --test tests/password-rules.test.mjs`. Esperado: FAIL, no existe el módulo.

- [ ] **Step 3: Implementar `password-rules.ts`** con `z` de `astro/zod` y los mensajes exactos de la prueba. Máximo de 128 caracteres en las contraseñas (el límite de Better Auth), con su mensaje en español.

- [ ] **Step 4:** repetir el paso 2. Esperado: 5 pruebas PASS.

- [ ] **Step 5: Cookies y Actions.**
  - `applyAuthCookies`: por cada elemento de `headers.getSetCookie()`, usar `parseSetCookieHeader` y `toCookieOptions` de `better-auth/cookies`, y llamar a `cookies.set(nombre, atributos.value, toCookieOptions(atributos))`. Dejar la codificación por defecto de Astro (el valor llega decodificado).
  - Las tres Actions usan `accept: 'form'`, llaman a `auth.api` o `changeOwnPassword` con `context.request.headers` y `returnHeaders: true`, y aplican las cookies.
  - `login`: `signInUsername`. Entrada `username` y `password`, obligatorios, con mensajes en español. Devuelve `mustChangePassword` del usuario de la respuesta; si el tipo no lo incluye, obtenerlo con `auth.api.getSession` usando la cookie recién emitida.
  - `changePassword`: usa `changePasswordInput`.
  - `logout`: `signOut`.
  - Errores con `APIError` de `better-auth/api`, siempre como `ActionError`:

| Caso | `code` | Mensaje |
| --- | --- | --- |
| `login`, cualquier `APIError` 4xx | `UNAUTHORIZED` | `Usuario o contraseña incorrectos.` |
| `changePassword`, contraseña actual errónea (`INVALID_PASSWORD`) | `BAD_REQUEST` | `La contraseña actual no es correcta.` |
| `changePassword`, sin sesión | `UNAUTHORIZED` | `Tu sesión terminó. Vuelve a entrar.` |
| Cualquier otro | `INTERNAL_SERVER_ERROR` | `Algo falló. Inténtalo de nuevo.` |

En el último caso, registrar el error con `console.error` sin incluir la entrada.

- [ ] **Step 6: Páginas.** `Layout.astro` recibe `title: string` y toma el `<head>` y el `<main>` de `index.astro`. Formularios con `method="POST"` y `action={actions.…}`; resultado con `Astro.getActionResult`. Errores de campo con `isInputError`, y el error general en un elemento con `role="alert"`.
  - `/login`: campos `username` (`autocomplete="username"`, `autocapitalize="none"`, `spellcheck="false"`) y `password` (`autocomplete="current-password"`). Con éxito, redirige a `/cambiar-contrasena` o `/`.
  - `/cambiar-contrasena`, en este orden: (1) si la Action tuvo éxito, redirigir a `/`; (2) si devolvió `UNAUTHORIZED` o no hay sesión, redirigir a `/login`; (3) mostrar el formulario. Campos con `autocomplete="current-password"` y `new-password`, `minlength="8"` en los nuevos. Incluye el botón "Cerrar sesión".
  - `/`: tras un `logout` correcto, redirigir a `/login`. Con sesión, saludo con el nombre y "Cerrar sesión"; sin sesión, enlace a `/login`.
  - La sesión se consulta con `auth.api.getSession({ headers: Astro.request.headers })`. La renovación de la cookie de sesión queda para el middleware del punto 4; anotarlo con un comentario `shortcut:`.

- [ ] **Step 7: Comprobar.** `node --test tests/password-rules.test.mjs && pnpm check && pnpm build`. Luego, con `pnpm dev`, en el navegador. Las páginas no deben enviar JavaScript propio (en el HTML del build o de la respuesta no hay `<script>` de la app; los del servidor de desarrollo no cuentan).
  - Contraseña errónea y usuario inexistente: mismo mensaje.
  - Entrar como `Prueba` con la temporal: lleva a `/cambiar-contrasena`.
  - Campos vacíos (con `curl` o quitando `required`): mensajes en español.
  - Contraseña actual errónea, nueva corta, sin coincidencia e igual a la actual: se rechazan y los campos quedan vacíos.
  - Con una segunda sesión abierta (`curl`, sign-in por HTTP), cambio correcto: lleva a `/` con sesión, y la segunda queda invalidada.
  - Cerrar sesión: lleva a `/login`. La temporal ya no sirve; la nueva lleva a `/`.
  - Abrir el cambio, borrar las cookies y enviar: lleva a `/login`.

- [ ] **Step 8: Commit** `feat: agregar acceso y cambio obligatorio de contraseña`.

---

### Task 3: Documentación

**Files:**
- Modify: `docs/roadmap.md`, `README.md`, `CLAUDE.md`, `docs/architecture.md`, `docs/data-model.md`, `docs/security.md`, `docs/design.md`, `docs/open-questions.md`

- [ ] **Step 1:** Marcar el punto 3 en el roadmap, solo si el paso 7 de la Tarea 2 pasó completo.
- [ ] **Step 2:** Actualizar las frases de estado actual en `README.md`, `CLAUDE.md`, `architecture.md`, `data-model.md` y `security.md`. En `README.md`, además: las dos variables nuevas, el uso del script y `node --test tests/password-rules.test.mjs`.
- [ ] **Step 3:** En `architecture.md`, anotar que el acceso pasa por Actions y qué rutas HTTP están desactivadas. En `data-model.md`, el correo ficticio. En `design.md`, agregar la ruta `/cambiar-contrasena`.
- [ ] **Step 4:** En `open-questions.md`, bajo "Técnicas": `/login` no limita los intentos porque las Actions no pasan por el límite de Better Auth; resolver antes del primer despliegue.
- [ ] **Step 5:** `pnpm check && pnpm build` sin errores. Commit `docs: documentar el acceso y cerrar el punto 3 de la fase 0`.
