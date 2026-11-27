# 014 — Docker solo para la base de datos local

**Estado:** reemplazada por la [decisión 016](016-neon-dev-branch.md) (27 nov 2026). Se aceptó el 26 nov 2026 y reemplazó la decisión inicial "Sin Docker".

**Decisión en breve:** Docker solo para la base de datos local

**Descartado:** Dockerizar la app, rama de desarrollo en Neon

- **Contexto:** Netlify compila desde el repositorio y no usa contenedores. En desarrollo conviene tener una base de datos en el propio equipo.
- **Decisión:** no se dockeriza la app, que corre con `pnpm dev`. PostgreSQL 17 corre en Docker (`docker-compose.yml`) solo para desarrollo. En producción la base es Neon. La versión de Node va en `.nvmrc` y las variables en `.env.example`.
- **Consecuencias:** hace falta Docker para trabajar con la base local. La versión mayor de PostgreSQL debe coincidir con la del proyecto de Neon. Si algún día se migra a un VPS, se agrega un Dockerfile para la app y se adapta el `docker-compose.yml`, sin cambiar el código.
