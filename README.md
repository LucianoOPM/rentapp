# Plataforma de rentas

Plataforma web, pensada para el celular, para administrar 3 departamentos en renta. Tiene dos tipos de usuario: la administradora y los inquilinos.

**Estado actual:** solo el esqueleto de Astro y la documentación. La Fase 0 está en curso.

## Requisitos

- Node 24 (ver `.nvmrc`)
- pnpm 12 (la versión exacta está en `package.json`)
- Docker, solo para la base de datos local

## Desarrollo local

```bash
nvm use 24
pnpm install
pnpm db:up
pnpm dev
```

El sitio queda en <http://localhost:4321>.

La app corre en tu equipo y solo PostgreSQL 17 corre en Docker, en `localhost:5432`, con usuario, contraseña y base `rentas`. Para conectarte, crea un archivo `.env` (no se versiona) con:

```
DATABASE_URL=postgres://rentas:rentas@localhost:5432/rentas
```

El esqueleto todavía no usa la base de datos. `pnpm db:down` detiene el contenedor y conserva los datos en el volumen `pgdata`.

## Scripts

| Comando | Qué hace |
| --- | --- |
| `pnpm dev` | Servidor de desarrollo |
| `pnpm check` | Revisión de tipos |
| `pnpm build` | Compilación para producción |
| `pnpm db:up` | Levanta PostgreSQL en Docker |
| `pnpm db:down` | Detiene PostgreSQL |

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
