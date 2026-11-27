# Project Kickoff Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Dejar la documentación base dividida en archivos y un esqueleto de Astro que arranque.

**Architecture:** Un solo proyecto de Astro en la raíz del repositorio. La documentación vive en `docs/` y se deriva del documento original más las seis recomendaciones aprobadas.

**Tech Stack:** Astro (`output: 'server'`), TypeScript estricto, Tailwind CSS, React, `@astrojs/netlify`, Node 24, npm.

**Spec:** `docs/superpowers/specs/2026-11-26-project-kickoff-design.md`

## Global Constraints

- Nombres de archivo en inglés; contenido en español neutro.
- `Plataforma de rentas — Documentación inicial.md` no se modifica ni se mueve.
- Sin base de datos, Drizzle, autenticación, middleware, Cloudinary, Resend, despliegue ni pantallas del producto.
- Sin carpetas ni módulos vacíos para fases futuras.
- `git init` sí; ningún commit hasta que el usuario lo pida (después, Conventional Commits).
- No usar Python.
- Sin pruebas unitarias: no hay lógica propia. La verificación es revisión de tipos, build y una petición a `/`.

## Review Focus

1. La herramienta de creación no debe sobrescribir `docs/` ni el documento original (Task 1, paso 1).
2. `.env` y sus variantes quedan fuera de git; `.env.example` queda dentro (Task 2, paso 4).
3. Ningún dato del documento original se pierde al dividirlo (Task 3, paso 4).
4. Ningún documento puede contradecir las recomendaciones aprobadas ni presentar como hecho algo aún sin construir (Task 3, paso 4).
5. Un clon limpio instala y compila solo con lo versionado (Task 2, paso 5).

---

### Task 1: Esqueleto de Astro

**Files:**
- Create: `package.json`, `package-lock.json`, `astro.config.mjs`, `tsconfig.json`, `src/pages/index.astro`, `src/styles/global.css` (la ruta que genere `astro add tailwind`)

**Interfaces:**
- Produces: scripts `npm run dev`, `npm run build`, `npm run check`.

- [ ] **Step 1:** Generar la plantilla en el scratchpad, no en la raíz: `npm create astro@latest <scratchpad>/astro-skeleton -- --template minimal --no-install --no-git --yes`. Copiar a la raíz solo los archivos que no existan.
- [ ] **Step 2:** Poner `"name": "plataforma-renta"` en `package.json`, ejecutar `npm install` y `npx astro add react tailwind netlify --yes`.
- [ ] **Step 3:** Fijar `output: 'server'` en `astro.config.mjs`. Instalar `@astrojs/check` y `typescript` como dependencias de desarrollo y agregar `"check": "astro check"`. Confirmar que `tsconfig.json` extiende `astro/tsconfigs/strict`.
- [ ] **Step 4:** Reducir `src/pages/index.astro` a una página con `lang="es"`, meta viewport, la hoja global importada, `<title>` y `<h1>` con "Plataforma de rentas", en una columna de máximo 480 px.
- [ ] **Step 5:** Ejecutar `npm run check` (0 errores) y `npm run build` (termina sin errores).
- [ ] **Step 6:** Levantar `npm run dev` en segundo plano, pedir `/` con `curl`, esperar HTTP 200 y el texto "Plataforma de rentas", y detener el servidor.

### Task 2: Archivos de arranque

**Files:**
- Create: `README.md`, `CLAUDE.md`, `.env.example`, `.nvmrc`
- Modify: `.gitignore`

**Interfaces:**
- Consumes: scripts de Task 1.

- [ ] **Step 1:** `.nvmrc` con `24`. `.env.example` con estas variables, sin valores: `DATABASE_URL`, `BETTER_AUTH_SECRET`, `BETTER_AUTH_URL`, `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, `CLOUDINARY_API_SECRET`, `RESEND_API_KEY`, `MAIL_FROM`, `ADMIN_EMAIL`, `WIFI_ENC_KEY`.
- [ ] **Step 2:** `.gitignore`: conservar lo generado y asegurar `.env`, `.env.*`, `!.env.example`, `.netlify/`.
- [ ] **Step 3:** `README.md`: qué es, requisitos, arranque (`npm install`, `npm run dev`), scripts, estado actual (solo esqueleto) e índice de `docs/`. `CLAUDE.md`: comandos, enlaces a `docs/`, reglas de la decisión 015, permisos (`getActiveLease`, revisión de `role`), centavos y UTC, textos en español, formularios sin JS salvo la firma, sin Python, Conventional Commits.
- [ ] **Step 4:** `git init`. Crear un `.env` vacío de prueba solo si no existe; `git check-ignore .env .env.local` debe listar ambas rutas y `git check-ignore .env.example` no debe listar nada. Borrar el `.env` de prueba.
- [ ] **Step 5:** `git add -n .` no incluye `node_modules`, `dist`, `.astro` ni `.netlify`, e incluye `package-lock.json`. Copiar esos archivos a un directorio nuevo del scratchpad y ejecutar ahí `npm ci` y `npm run build`: sin errores.

### Task 3: Documentación

**Files:**
- Create: `docs/overview.md`, `docs/architecture.md`, `docs/data-model.md`, `docs/security.md`, `docs/roadmap.md`, `docs/design.md`, `docs/costs.md`, `docs/open-questions.md`, `docs/decisions/README.md`, `docs/decisions/NNN-<slug>.md` (15)

**Interfaces:**
- Consumes: el documento original y las recomendaciones 1 a 6 de la especificación.

- [ ] **Step 1:** Slugs de decisiones: `001-mobile-first-web`, `002-astro-fullstack`, `003-react-islands`, `004-no-global-state`, `005-better-auth-username`, `006-neon-drizzle`, `007-cloudinary-private-files`, `008-simple-esignature`, `009-spei-proof-of-payment`, `010-manual-monthly-charges`, `011-wifi-per-unit`, `012-whatsapp-notices`, `013-netlify-free`, `014-no-docker`, `015-portability-rules`. Cada archivo: estado y fecha (aceptada, 26 nov 2026), y solo las secciones que el original tenga para esa decisión, más la alternativa descartada de su tabla.
- [ ] **Step 2:** Dividir el resto según la lista de la especificación, conservando el texto y las casillas del roadmap. Reemplazar el diagrama incrustado, que no se exportó, por un diagrama Mermaid construido a partir del texto de "Arquitectura".
- [ ] **Step 3:** Integrar las recomendaciones:
  - 1 (subidas): `architecture.md`, `design.md` (lineamiento de formularios), decisión 013.
  - 2 (tabla `file`): `data-model.md`. `original_pdf_key`, `signed_pdf_key`, `receipt_key`, `proof_key` y `file_key` pasan a `original_file_id`, `signed_file_id`, `receipt_file_id`, `proof_file_id` y `file_id`. Ajustar `security.md` y la decisión 015.
  - 3 (correo): `architecture.md`, `costs.md`, `roadmap.md` (tarea de Resend en Fase 0), decisión 012. Anotar que no se puede enviar desde `@gmail.com` ni `@hotmail.com` (deducido de la verificación de dominio por DNS) y que el plan gratuito permite 100 correos al día y 3,000 al mes.
  - 4 (contrato): `data-model.md`, `security.md`.
  - 5 (agua): `data-model.md`, decisión 010.
  - 6 (pagos): `data-model.md`, `design.md`.
  - `open-questions.md`: confirmar con la propietaria pagos parciales y renovaciones anticipadas; dominio propio para producción; revisión legal de la cláusula de firma; límites y precios del documento original sin verificar; definir los campos de fecha restantes y la frecuencia y el destino del respaldo `pg_dump`.
- [ ] **Step 4:** Releer el documento original sección por sección y marcar dónde quedó cada una. Buscar en `docs/` (sin `superpowers/`) nombres viejos `_key` de archivos: solo pueden quedar `file_key`/`key` como los define la tabla `file` y la decisión 015.
- [ ] **Step 5:** Comprobar con un script de Node en el scratchpad que todos los enlaces relativos de `README.md`, `CLAUDE.md` y `docs/` apuntan a archivos existentes: 0 rotos.
