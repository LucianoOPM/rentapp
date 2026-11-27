# 002 — Astro fullstack

**Estado:** aceptada (26 nov 2026)

**Decisión en breve:** Astro fullstack

**Descartado:** Next.js, NestJS

- **Contexto:** la mayoría de las pantallas son para consultar, con pocos formularios.
- **Decisión:** Astro con `output: 'server'`, Actions para los formularios y endpoints para la autenticación y los archivos.
- **Alternativas:** Next.js funcionaría, pero no aporta nada que haga falta aquí. NestJS agregaría un segundo servidor que desplegar.
- **Consecuencias:** cada cambio de pantalla carga una página nueva, y para este uso basta.
