# 007 — Archivos privados en Cloudinary

**Estado:** aceptada (26 nov 2026)

**Decisión en breve:** Archivos privados en Cloudinary

**Descartado:** Cloudflare R2, Netlify Blobs, Supabase Storage

- **Contexto:** ya se conoce Cloudinary, su plan gratuito no pide tarjeta y optimiza las fotos de mantenimiento automáticamente.
- **Decisión:** todos los archivos se suben con `type: 'authenticated'` y se activa "Allow delivery of PDF and ZIP files" en la configuración de Security, porque el plan gratuito bloquea los PDFs por defecto. El navegador nunca recibe una URL de Cloudinary: `/api/files/[publicId]` revisa permisos, descarga el archivo con una URL firmada y lo reenvía.
- **Alternativas:** Cloudflare R2 es más generoso (10 GB y sin costo de salida), pero pide registrar una tarjeta para activarlo. Netlify Blobs ataría los archivos al hosting.
- **Consecuencias:** en el plan gratuito las URLs firmadas no vencen, por eso nunca salen del servidor. Reenviar los archivos consume un poco del ancho de banda de Netlify.
