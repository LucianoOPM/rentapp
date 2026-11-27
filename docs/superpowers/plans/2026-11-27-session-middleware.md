# Session Middleware Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Leer la sesión en un middleware y proteger `/admin` y `/app` por rol.

**Architecture:** Una función pura decide la redirección a partir de `context.routePattern` y el usuario. `src/middleware.ts` obtiene la sesión por `authService`, renueva la cookie, llena `locals.user` y aplica esa función.

**Tech Stack:** Astro 7.4.13, Better Auth 1.7.28, `node --test`.

**Spec:** [diseño](../specs/2026-11-27-session-middleware-design.md)

## Global Constraints

- Alias `@` en `src/`; rutas relativas en `tests/`. Sin *parameter properties* ni `enum` en lo que prueba `node --test`.
- Sin dependencias ni migraciones nuevas. Commits solo si el usuario los pide.

## Review Focus

- Ruta parecida (`/application`, `/administrar`): no es parte de `/app` ni de `/admin`.
- Usuario con contraseña temporal en `/cambiar-contrasena`: no hay bucle de redirección.
- Rol equivocado: la redirección lleva a un área permitida, sin bucle.
- Cerrar sesión desde `/admin` o `/app`: termina en `/login`.
- Cookie inválida o vencida: se trata como sin sesión.

### Task 1: Reglas de acceso

**Files:** Create `src/lib/route-access.ts`, `tests/route-access.test.mjs`

**Interfaces:** Produces `accessRedirect(routePattern: string, user: { role?: string | null; mustChangePassword?: boolean | null } | null): string | null`

- [ ] Escribir las pruebas con cada fila de la tabla del diseño y los casos de Review Focus.
- [ ] `node --test tests/route-access.test.mjs`: falla porque el módulo no existe.
- [ ] Implementar y volver a ejecutar: pasa.

### Task 2: Middleware, páginas y documentación

**Files:** Create `src/middleware.ts`, `src/env.d.ts`, `src/pages/admin/index.astro`, `src/pages/app/index.astro`. Modify `src/lib/services/auth-service.ts`, `src/pages/index.astro`, `src/pages/cambiar-contrasena.astro`, `tsconfig.json` solo si hace falta, `README.md`, `CLAUDE.md`, `docs/architecture.md`, `docs/security.md`, `docs/data-model.md`, `docs/roadmap.md`.

**Interfaces:** Consumes `accessRedirect`. Produces `authService.resolveSession(headers)` (`{ headers, response }`) y `Astro.locals.user` (usuario de la sesión o `null`).

- [ ] El middleware no actúa sobre `/api/auth/[...all]`; en las demás rutas aplica `applyAuthCookies` antes de redirigir o continuar.
- [ ] Las páginas usan `Astro.locals.user` y se quitan los comentarios `shortcut:` sobre la cookie.
- [ ] `pnpm check`, `pnpm build` y `node --test tests/*.test.mjs` pasan.
- [ ] Probar por HTTP con `pnpm dev` las redirecciones.
- [ ] Marcar el punto 4 en el roadmap y actualizar el estado en la documentación.
