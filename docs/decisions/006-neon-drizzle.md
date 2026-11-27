# 006 — PostgreSQL en Neon + Drizzle

**Estado:** aceptada (26 nov 2026)

**Decisión en breve:** PostgreSQL en Neon + Drizzle

**Descartado:** Supabase

- **Decisión:** Neon en su plan gratuito, con Drizzle para el esquema, las migraciones y el adaptador de Better Auth.
- **Consecuencias:** sin Row Level Security, los permisos se revisan en el código con `getActiveLease`.
