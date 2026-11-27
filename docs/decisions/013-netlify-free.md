# 013 — Hosting en Netlify Free

**Estado:** aceptada (26 nov 2026)

**Decisión en breve:** Hosting en Netlify Free

**Descartado:** Vercel Hobby, Cloudflare Workers Free, Railway Free

- **Contexto:** la plataforma apoya un negocio de rentas, así que cuenta como uso comercial, y la meta es que todo sea gratis.
- **Decisión:** Netlify Free con el adaptador `@astrojs/netlify`. Su plan gratuito permite proyectos comerciales y da 300 créditos al mes.
- **Alternativas:** Vercel Hobby está limitado a uso no comercial. Cloudflare Workers Free da solo 10 ms de CPU por petición, muy poco para el hashing de contraseñas de Better Auth. Railway Free da $1 de crédito al mes, se duerme y no permite dominio propio.
- **Consecuencias:** si se agotan los créditos, el sitio se suspende el resto del mes. Hay que revisar el panel de uso el primer mes y reducir las fotos antes de subirlas (en el navegador, como mejora progresiva). Cada petición con archivos se limita a unos 4 MB ([detalles](../architecture.md#subida-de-archivos)). Si crece, el siguiente paso es Netlify Personal o Railway Hobby.
