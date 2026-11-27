# Plataforma de rentas

Plataforma web, pensada para el celular, para administrar 3 departamentos en renta. Tiene dos tipos de usuario: la administradora y los inquilinos.

**Estado actual:** el esqueleto de Astro, la documentación y el esquema de la base de datos con su primera migración. La Fase 0 está en curso.

## Requisitos

- Node 24 (ver `.nvmrc`)
- pnpm 12 (la versión exacta está en `package.json`)
- Docker, solo para la base de datos local

## Desarrollo local

```bash
nvm use 24
pnpm install
pnpm db:up
pnpm db:migrate
pnpm dev
```

El sitio queda en <http://localhost:4321>.

La app corre en tu equipo y solo PostgreSQL 17 corre en Docker, en `localhost:5432`, con usuario, contraseña y base `rentas`. Para conectarte, crea un archivo `.env` (no se versiona) con:

```
DATABASE_URL=postgres://rentas:rentas@localhost:5432/rentas
```

Crea el `.env` antes de ejecutar `pnpm db:migrate`. Todavía ninguna página usa la base de datos. `pnpm db:down` detiene el contenedor y conserva los datos en el volumen `pgdata`.

## Scripts

| Comando | Qué hace |
| --- | --- |
| `pnpm dev` | Servidor de desarrollo |
| `pnpm check` | Revisión de tipos |
| `pnpm build` | Compilación para producción |
| `pnpm db:up` | Levanta PostgreSQL en Docker |
| `pnpm db:down` | Detiene PostgreSQL |
| `pnpm db:generate` | Genera una migración a partir de `src/lib/schema/` |
| `pnpm db:migrate` | Aplica las migraciones a la base de `DATABASE_URL` |

## Migraciones en producción (Neon)

Se aplican a mano, antes de desplegar un cambio que las necesite. Usa la conexión **directa** de Neon (su host no contiene `-pooler`) y no la guardes en archivos. En PowerShell 7.1 o posterior (`pwsh`; Windows PowerShell 5.1 no tiene `-MaskInput`), ejecuta cada línea por separado. La cadena no se muestra al pegarla:

```powershell
$env:DATABASE_URL = Read-Host -MaskInput "Pega la conexión directa de Neon"
```

```powershell
pnpm db:migrate
```

```powershell
Remove-Item Env:DATABASE_URL
```

La última se ejecuta siempre, aunque la migración falle: si la variable queda definida, el siguiente comando irá contra producción.

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
