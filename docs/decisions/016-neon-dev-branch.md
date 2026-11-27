# 016 — Rama `dev` de Neon para desarrollo

**Estado:** aceptada (27 nov 2026). Reemplaza la [decisión 014](014-docker-database-only.md).

**Decisión en breve:** Rama `dev` de Neon para desarrollo, sin Docker

**Descartado:** PostgreSQL local en Docker

- **Contexto:** producción usa Neon con PostgreSQL 18 y la base local en Docker usaba la 17. Se prefiere desarrollar contra el mismo servicio.
- **Decisión:** el desarrollo local usa la rama `dev` de Neon y producción usa la rama `production`. No se usa Docker. La app corre con `pnpm dev`. La versión de Node va en `.nvmrc` y las variables en `.env.example`.
- **Consecuencias:** hace falta conexión a internet para desarrollar y el consumo de la rama `dev` cuenta para el plan de Neon. La rama `dev` no debe contener datos reales de inquilinos. La app sigue usando el driver estándar `pg` ([decisión 015](015-portability-rules.md)).
