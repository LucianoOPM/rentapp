# Plataforma de rentas

Plataforma web, pensada para el celular, para administrar 3 departamentos en renta. Tiene dos tipos de usuario: la administradora y los inquilinos.

**Estado actual:** el esqueleto de Astro, la documentación, el esquema de la base de datos con su primera migración y el acceso con usuario y contraseña, que pide cambiar la contraseña temporal, y la protección de `/admin` y `/app` por rol (con páginas provisionales) y la descarga de archivos privados guardados en Cloudinary. La Fase 0 está en curso.

## Requisitos

- Node 24 (ver `.nvmrc`)
- pnpm 12 (la versión exacta está en `package.json`)
- Una conexión a la rama `dev` del proyecto de Neon

## Desarrollo local

```bash
nvm use 24
pnpm install
pnpm db:migrate
pnpm dev
```

El sitio queda en <http://localhost:4321>.

La app corre en tu equipo y la base es la rama `dev` de Neon. Antes de ejecutar `pnpm db:migrate`, crea un archivo `.env` (no se versiona) con la conexión **directa** de esa rama (su host no contiene `-pooler`):

```
DATABASE_URL=postgresql://<rol>:<contraseña>@<host-de-dev>/<base>?sslmode=verify-full
```

Deja activa la conexión de `dev`; la de `production` solo se activa para migrar ([pasos](#migraciones-en-producción-neon)). El `.env` también necesita las variables del acceso:

```
BETTER_AUTH_URL=http://localhost:4321
BETTER_AUTH_SECRET=<32 caracteres o más>
```

Y la de Cloudinary, sin la cual la app no arranca. Cópiala del panel de Cloudinary y activa en Settings → Security la opción **Allow delivery of PDF and ZIP files**:

```
CLOUDINARY_URL=cloudinary://<api_key>:<api_secret>@<cloud_name>
```

Para generar el secreto:

```bash
node -e "console.log(require('node:crypto').randomBytes(32).toString('base64'))"
```

El registro está cerrado. Para crear un usuario de prueba en `dev` (el script muestra el host de la base y pide confirmación):

```bash
node scripts/create-test-user.mjs <usuario> <contraseña-temporal>
```

Después entra en <http://localhost:4321/login>.

## Correo (Resend)

Solo se usa para avisar a la administradora. La app todavía no envía nada ni necesita estas variables para arrancar.

1. Crea la cuenta en [Resend](https://resend.com) con el correo de la administradora.
2. En **API Keys**, crea una clave con permiso **Sending access**. Solo se muestra al crearla.
3. Agrega al `.env`:

   ```
   RESEND_API_KEY=<tu clave>
   MAIL_FROM=onboarding@resend.dev
   ADMIN_EMAIL=<correo de la cuenta de Resend>
   ```

4. Envía un correo real de prueba y confirma que llegó (revisa también spam):

   ```powershell
   node scripts/check-email.mjs
   ```

Sin dominio propio, `onboarding@resend.dev` solo envía al correo de la cuenta. En la página **Emails** y en **Logs** del panel de Resend puedes revisar qué pasó con cada envío.

### Usarlo en el código

`src/lib/email.ts` es el único archivo que habla con Resend. `sendEmail({ subject, text })` envía texto plano y siempre a `ADMIN_EMAIL`. Si falla, lanza un error con el código HTTP, sin datos sensibles. No reintenta.

Al crear el primer servicio que avise (fase 1):

1. En `astro.config.mjs`, declara `RESEND_API_KEY`, `MAIL_FROM` y `ADMIN_EMAIL` en `env.schema`, como las demás (secretas, con `min: 1`). Desde ahí la app las necesita.
2. En `src/lib/container.ts`, crea `new ResendMailer({ apiKey: RESEND_API_KEY, from: MAIL_FROM, adminEmail: ADMIN_EMAIL })` y pásalo al servicio por el constructor.
3. En el servicio, importa solo el tipo y avisa **después** de guardar. Un aviso que falla no debe deshacer lo guardado:

   ```ts
   // Dentro del servicio, ya guardado el comprobante:
   try {
     await this.#mailer.sendEmail({ subject: 'Comprobante nuevo', text: 'Hay un comprobante por revisar.' });
   } catch (error) {
     console.error(error);
   }
   ```

   Usa `await`: en una función serverless, un envío sin esperar puede quedarse a medias. La petición se corta a los 10 segundos.

El plan gratuito permite 100 correos al día y 3,000 al mes ([límites](https://resend.com/docs/knowledge-base/account-quotas-and-limits)).

## Scripts

| Comando | Qué hace |
| --- | --- |
| `pnpm dev` | Servidor de desarrollo |
| `pnpm check` | Revisión de tipos |
| `pnpm build` | Compilación para producción |
| `pnpm db:generate` | Genera una migración a partir de `src/lib/schema/` |
| `pnpm db:migrate` | Aplica las migraciones a la base de `DATABASE_URL` |
| `node --test tests/password-rules.test.mjs` | Prueba las reglas del cambio de contraseña |
| `node --test tests/auth-service.test.mjs` | Prueba el servicio de acceso con dependencias falsas |
| `node --test tests/route-access.test.mjs` | Prueba las reglas de acceso por ruta y rol |
| `node --test tests/*.test.mjs` | Corre todas las pruebas |
| `node scripts/check-storage.mjs` | Comprueba subida, descarga y borrado contra la cuenta real de Cloudinary |
| `node scripts/check-email.mjs` | Envía un correo real de prueba a `ADMIN_EMAIL` con Resend |

## Migraciones en producción (Neon)

En Netlify, `DATABASE_URL` usa la conexión **con pooler** de Neon (su host contiene `-pooler`). No ejecutes `neon env pull` ni `neon deploy` sin revisar antes dónde escriben: pueden reemplazar tu `.env` local con la base de producción, porque `.neon` apunta a la rama `production`.

Se aplican a mano, antes de desplegar un cambio que las necesite. En `.env` guarda las dos conexiones **directas** (host sin `-pooler`), cada una en su línea, y deja comentada la que no uses:

```
# Desarrollo
DATABASE_URL=<conexión de dev>
# Producción
# DATABASE_URL=<conexión de production>
```

1. Comenta la línea de desarrollo y descomenta la de producción. Debe quedar solo una activa.
2. Revisa que la terminal no tenga ya definida `DATABASE_URL`, porque tiene prioridad sobre `.env`. Después ejecuta:

   ```powershell
   pnpm db:migrate
   ```

3. Vuelve a dejar activa la de desarrollo, aunque la migración falle. Mientras siga la de producción, `pnpm dev` y `pnpm db:migrate` trabajan contra los datos reales.

## Documentación

- [Resumen, alcance y stack](docs/overview.md)
- [Arquitectura](docs/architecture.md)
- [Modelo de datos](docs/data-model.md)
- [Permisos y archivos](docs/security.md)
- [Roadmap](docs/roadmap.md)
- [Diseño](docs/design.md)
- [Costos](docs/costs.md)
- [Decisiones](docs/decisions/README.md)
- [Preguntas abiertas](docs/open-questions.md)
