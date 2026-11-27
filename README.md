# Plataforma de rentas

Plataforma web, pensada para el celular, para administrar 3 departamentos en renta. Tiene dos tipos de usuario: la administradora y los inquilinos.

**Estado actual:** el esqueleto de Astro, la documentación, el esquema de la base de datos con su primera migración y el acceso con usuario y contraseña, que pide cambiar la contraseña temporal. Todavía no hay protección de rutas ni roles. La Fase 0 está en curso.

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

Para generar el secreto:

```bash
node -e "console.log(require('node:crypto').randomBytes(32).toString('base64'))"
```

El registro está cerrado. Para crear un usuario de prueba en `dev` (el script muestra el host de la base y pide confirmación):

```bash
node scripts/create-test-user.mjs <usuario> <contraseña-temporal>
```

Después entra en <http://localhost:4321/login>.

## Scripts

| Comando | Qué hace |
| --- | --- |
| `pnpm dev` | Servidor de desarrollo |
| `pnpm check` | Revisión de tipos |
| `pnpm build` | Compilación para producción |
| `pnpm db:generate` | Genera una migración a partir de `src/lib/schema/` |
| `pnpm db:migrate` | Aplica las migraciones a la base de `DATABASE_URL` |
| `pnpm db:check` | Comprueba las reglas del esquema sin dejar datos |
| `node --test tests/password-rules.test.mjs` | Prueba las reglas del cambio de contraseña |

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

3. Vuelve a dejar activa la de desarrollo, aunque la migración falle. Mientras siga la de producción, `pnpm dev`, `pnpm db:migrate` y `pnpm db:check` trabajan contra los datos reales.

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
