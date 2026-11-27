# Correo con Resend: diseño

Punto 6 de la fase 0 del [roadmap](../../roadmap.md). Fecha: 27 nov 2026. Estado: aprobado.

## Propósito

Dejar listo el envío de correos para avisar **a la administradora** de lo que tiene por revisar. Los inquilinos reciben avisos por WhatsApp ([decisión 012](../../decisions/012-whatsapp-notices.md)) y el acceso no usa correo.

**Fuera de alcance:** los avisos de comprobantes y reportes (fase 1), conectar el módulo a `container.ts` y a `astro:env` (se hace con el primer servicio que lo use), plantillas HTML, reintentos, Web Push y las variables en Netlify.

## Canal

Se eligió correo frente a Web Push, avisos dentro de la app y WhatsApp. La administradora usa Android y no revisa mucho el correo, así que la prueba real se hace sin avisarle: si no ve el aviso a tiempo, se adelanta Web Push a la fase 1.

## Enfoques

| Enfoque | A cambio | Resultado |
| --- | --- | --- |
| **A. API HTTP con `fetch`** | Mantener a mano el formato de la petición | **Elegido.** Es una sola petición, sin dependencias nuevas. |
| B. SDK `resend` | Una dependencia | Descartado: solo se usa el envío. |

## Módulo (`src/lib/email.ts`)

Es el único archivo que habla con Resend. Recibe la configuración y `fetch` por el constructor, sin `astro:env`, para poder usarlo desde Node.

- `sendEmail({ subject, text })` envía texto plano con `POST https://api.resend.com/emails`.
- El destinatario es siempre `ADMIN_EMAIL`; no se puede elegir en cada envío.
- Cabeceras: `Authorization`, `Content-Type` y `User-Agent`, que Resend exige (sin ella responde 403).
- La petición se corta a los 10 segundos.
- Si falla, lanza un error que solo dice el código HTTP, sin la API key, los correos ni la respuesta de Resend.
- Si falta una variable, el constructor falla y dice cuáles, sin repetir valores.

Quien lo use decide qué hacer si el envío falla. Un aviso que falla no debe deshacer el comprobante o el reporte ya guardado.

## Configuración

`RESEND_API_KEY` (con permiso **Sending access**), `MAIL_FROM` (`onboarding@resend.dev` mientras no haya dominio) y `ADMIN_EMAIL` (el correo de la cuenta de Resend).

## Comprobación

- `tests/email.test.mjs`: sin red, con un `fetch` falso.
- `scripts/check-email.mjs`: envía un correo real. El punto 6 se cierra cuando llega a `ADMIN_EMAIL`.
