# Resumen, alcance y stack

Una plataforma web, sencilla y pensada para el celular, para administrar 3 departamentos en renta ubicados en la planta alta de la casa familiar. Tiene dos tipos de usuario: la **administradora** (la propietaria) y los **inquilinos**.

**Qué resuelve:**

- Ver y firmar el contrato en línea, con copia digital siempre disponible.
- Estado de cuenta mensual por departamento: renta, depósito, luz, agua y, más adelante, internet.
- Pago por transferencia SPEI con comprobante, que la administradora confirma.
- Entrega de los recibos de CFE y de agua de cada departamento.
- Reportes de mantenimiento con fotos y seguimiento.
- Consulta del nombre de la red y la contraseña de WiFi de cada departamento.

**Fuera de alcance:** app nativa o instalable, pagos con tarjeta, automatizaciones y facturación (CFDI).

## Stack inicial

| Capa | Herramienta | Para qué |
| --- | --- | --- |
| Fullstack | Astro (`output: 'server'`) + Actions | Páginas en el servidor, formularios y lógica en un solo proyecto. |
| Interactividad | Islas de React | Solo para la firma con el dedo. |
| Estilos | Tailwind CSS | Diseño adaptado al celular. |
| Autenticación | Better Auth (plugin username) | Usuario y contraseña, sin correo, y roles. La administradora crea las cuentas. |
| Base de datos | PostgreSQL en Neon | Todos los datos de la plataforma. |
| ORM | Drizzle | Consultas con tipos y migraciones. |
| Archivos | Cloudinary | Contratos, recibos, comprobantes y fotos. Privados y servidos solo a través de la app. |
| Firma | signature\_pad + pdf-lib | Firma en el PDF, con fecha, hora y huella SHA-256. |
| Correos | Resend | Solo avisos a la administradora. Los inquilinos reciben avisos por WhatsApp con enlaces wa.me. |
| Hosting | Netlify Free (`@astrojs/netlify`) | Despliegue con `git push`. |
| Lenguaje | TypeScript | Todo el proyecto. |
