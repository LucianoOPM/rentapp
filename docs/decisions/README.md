# Decisiones

Las decisiones 001 a 015 se aceptaron el 26 nov 2026 con un mismo criterio: lo más simple que funcione para 3 departamentos y una sola administradora. Cada una se puede revisar si el uso real lo pide.

| # | Decisión | Descartado |
| --- | --- | --- |
| [001](001-mobile-first-web.md) | Web adaptada al celular, sin app instalable | App nativa, PWA |
| [002](002-astro-fullstack.md) | Astro fullstack | Next.js, NestJS |
| [003](003-react-islands.md) | React solo en islas | Preact |
| [004](004-no-global-state.md) | Sin manejador de estado global | nanostores, Zustand |
| [005](005-better-auth-username.md) | Better Auth con usuario y contraseña | Supabase Auth, código por correo, SMS |
| [006](006-neon-drizzle.md) | PostgreSQL en Neon + Drizzle | Supabase |
| [007](007-cloudinary-private-files.md) | Archivos privados en Cloudinary | Cloudflare R2, Netlify Blobs, Supabase Storage |
| [008](008-simple-esignature.md) | Firma electrónica simple con constancia | DocuSign, NOM-151 desde el inicio |
| [009](009-spei-proof-of-payment.md) | Pago SPEI con comprobante y confirmación manual | Mercado Pago, Stripe |
| [010](010-manual-monthly-charges.md) | Cargos mensuales capturados a mano | Cron automático |
| [011](011-wifi-per-unit.md) | WiFi: una red por departamento con contraseña manual | Portal cautivo, API de Omada, QR en la plataforma |
| [012](012-whatsapp-notices.md) | Avisos a inquilinos por WhatsApp | WhatsApp Cloud API |
| [013](013-netlify-free.md) | Hosting en Netlify Free | Vercel Hobby, Cloudflare Workers Free, Railway Free |
| [014](014-docker-database-only.md) | Docker solo para la base de datos local (reemplazada por la 016) | Dockerizar la app, rama de desarrollo en Neon |
| [015](015-portability-rules.md) | Reglas de portabilidad entre proveedores | Llamar a cada proveedor desde cualquier parte del código |
| [016](016-neon-dev-branch.md) | Rama `dev` de Neon para desarrollo, sin Docker | PostgreSQL local en Docker |
