# 015 — Reglas de portabilidad

**Estado:** aceptada (26 nov 2026)

**Decisión en breve:** Reglas de portabilidad entre proveedores

**Descartado:** Llamar a cada proveedor desde cualquier parte del código

- **Contexto:** los planes gratuitos cambian sus condiciones, y migrar de proveedor debe costar una tarde, no una reescritura.
- **Decisión:**
  1. Todo el acceso a archivos pasa por `src/lib/storage.ts` (`upload`, `get`, `remove`).
  2. La tabla `file` guarda una `key` propia y el `provider`, nunca la URL de Cloudinary. Las demás tablas la referencian por `id`.
  3. Drizzle con un driver estándar de PostgreSQL (`postgres` o `pg`). Si se usa el driver de Neon, queda aislado en `src/lib/db.ts`.
  4. Los correos pasan por una sola función, `sendEmail()`.
  5. No se usan funciones exclusivas de Netlify (Blobs, Forms, Edge Functions): todo pasa por Actions, endpoints y middleware de Astro.
  6. Toda la configuración va en variables de entorno, y se hace un respaldo periódico con `pg_dump`.
- **Consecuencias:** cambiar de hosting es cambiar el adaptador. Cambiar de base de datos es `pg_dump` más una `DATABASE_URL` nueva. Cambiar de almacenamiento es reescribir `storage.ts` y mover los archivos con un script.
