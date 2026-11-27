# Plataforma de rentas

Astro (`output: 'server'`) + TypeScript + Tailwind + React (solo islas), en Netlify. Hoy existen el esqueleto y el esquema de la base; el resto de lo que describen los documentos todavía no está construido.

## Comandos

Usa solo pnpm. `pnpm dev`, `pnpm check`, `pnpm build`. Antes de dar un cambio por terminado, `check` y `build` deben pasar. Node 24.

En desarrollo la base es la rama `dev` de Neon; no se usa Docker. Las migraciones se generan con `pnpm db:generate` y se aplican con `pnpm db:migrate`. El esquema se comprueba con `pnpm db:check`.

## Antes de escribir código

Lee [arquitectura](docs/architecture.md), [modelo de datos](docs/data-model.md), [permisos](docs/security.md), [diseño](docs/design.md), [roadmap](docs/roadmap.md) y [decisiones](docs/decisions/README.md). Revisa [preguntas abiertas](docs/open-questions.md) y no las resuelvas por tu cuenta.

## Reglas

- Plataforma de un solo cliente con varios inquilinos; no es multi-tenant. El rol de inquilino es `renter`.
- En URL y formularios se usa `public_id`, nunca `id`.
- Permisos en el código: toda consulta de un inquilino pasa por `getActiveLease(user)`; nunca confíes en un id del formulario sin verificarlo. Las Actions de administración revisan `role === 'admin'` antes de cualquier otra cosa.
- Solo la capa de dominio (`src/lib/`) habla con Neon, Cloudinary y Resend.
- Archivos solo por `src/lib/storage.ts` y `/api/files/[publicId]`. El navegador nunca recibe una URL de Cloudinary.
- Correos solo por `sendEmail()`.
- Driver estándar de PostgreSQL; si se usa el de Neon, aislado en `src/lib/db.ts`.
- Sin funciones exclusivas de Netlify (Blobs, Forms, Edge Functions). Toda la configuración va en variables de entorno, documentadas en `.env.example`.
- Montos en centavos (enteros) y fechas en UTC; se muestran en `America/Mexico_City`.
- Textos en español, tuteando al inquilino.
- Los formularios funcionan sin JavaScript; la firma es la única excepción.
- No uses Python. Para scripts, Node o bash.
- Commits en formato Conventional Commits.
