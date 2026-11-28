# Correo con Resend: plan de implementación

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Enviar correos a la administradora con Resend.

**Architecture:** Un adaptador, `src/lib/email.ts`, con la configuración y `fetch` inyectados por el constructor. Sigue el patrón de `src/lib/storage.ts`. Todavía no se conecta a `container.ts`.

**Tech Stack:** TypeScript, `fetch` de Node, `node --test`.

**Spec:** [diseño](../specs/2026-11-27-email-resend-design.md)

## Global Constraints

- Sin dependencias nuevas; sin SDK `resend`.
- `node --test` carga el módulo: sin *parameter properties*, `enum`, `astro:env` ni alias `@` en importaciones de valor.
- El destinatario es siempre `ADMIN_EMAIL`.
- Los errores no incluyen la API key, los correos ni la respuesta de Resend.
- `pnpm check` y `pnpm build` deben pasar.
- Commits solo cuando el usuario los pida (Conventional Commits).

## Review Focus

- Variable vacía o ausente: falla al construir y nombra la variable (tarea 1).
- Resend responde 403 (destinatario distinto al de la cuenta, o API key inválida): error con el código, sin datos (tarea 1).
- Falla de red o espera de más de 10 s: error sin datos (tarea 1).
- Asunto o texto vacío: no se llama a la API (tarea 1).
- El script sin `.env` completo: mensaje claro y código de salida distinto de 0 (tarea 2).

---

### Task 1: Adaptador de correo

**Files:**
- Create: `src/lib/email.ts`, `tests/email.test.mjs`

**Interfaces:**
- Produces:
  - `type EmailConfig = { apiKey: string; from: string; adminEmail: string }`
  - `emailConfigFrom(env: Record<string, string | undefined>): EmailConfig`: lee `RESEND_API_KEY`, `MAIL_FROM`, `ADMIN_EMAIL`.
  - `class ResendMailer { constructor(config: EmailConfig, fetchFn?: typeof fetch); sendEmail(message: { subject: string; text: string }): Promise<void> }`

- [ ] **Step 1:** Escribir las pruebas: URL, cabeceras (`Authorization: Bearer <key>`, `Content-Type`, `User-Agent: mailer/1.0`) y cuerpo `{ from, to: adminEmail, subject, text }`; un `to` extra en el mensaje no cambia el destinatario; HTTP 403 rechaza con `Resend: falló el envío (HTTP 403)` sin filtrar datos; falla de red rechaza sin filtrar datos; la petición lleva `signal`; asunto o texto vacío rechaza sin llamar a `fetch`; `emailConfigFrom` nombra las variables que faltan sin repetir valores.
- [ ] **Step 2:** `node --test tests/email.test.mjs` falla porque el módulo no existe.
- [ ] **Step 3:** Implementar `src/lib/email.ts` con `AbortSignal.timeout(10_000)`.
- [ ] **Step 4:** `node --test tests/email.test.mjs` pasa.

### Task 2: Comprobación real y documentación

**Files:**
- Create: `scripts/check-email.mjs`
- Modify: `.env.example`, `README.md`, `docs/architecture.md`, `CLAUDE.md`

**Interfaces:**
- Consumes: `emailConfigFrom`, `ResendMailer`.

- [ ] **Step 1:** Script que carga `.env` como `check-storage.mjs`, envía un correo de prueba e imprime `OK` o el error, con salida 1.
- [ ] **Step 2:** Documentar las tres variables en `.env.example`; en `README.md`, la guía de la cuenta, la prueba y el uso; actualizar el estado en `architecture.md` y `CLAUDE.md`. La casilla del roadmap no se marca hasta que llegue el correo real.
- [ ] **Step 3:** `node --test tests/*.test.mjs`, `pnpm check` y `pnpm build` pasan. El script sin variables sale con 1 y las nombra.
