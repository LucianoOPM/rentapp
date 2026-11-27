# 012 — Avisos a inquilinos por WhatsApp

**Estado:** aceptada (26 nov 2026)

**Decisión en breve:** Avisos a inquilinos por WhatsApp

**Descartado:** WhatsApp Cloud API

- **Decisión:** la plataforma arma el mensaje (cargos del mes, recordatorios, contraseña temporal) y la administradora lo envía desde su WhatsApp con un enlace `wa.me`. Resend solo le avisa a ella de comprobantes y reportes nuevos. Mientras no haya dominio propio, envía desde `onboarding@resend.dev` al correo de la cuenta de Resend ([detalles](../architecture.md#correo)).
- **Alternativas:** la API de WhatsApp requiere verificación del negocio y cobra por mensaje.
