# 017 — Capas e inyección de dependencias

**Estado:** aceptada (27 nov 2026)

**Decisión en breve:** Controlador, servicio y repositorio, con inyección por constructor

**Descartado:** Consultas dentro de la lógica de negocio, contenedor de inyección con librería

- **Contexto:** es una preferencia de quien desarrolla el proyecto, y se aplica desde ahora, mientras hay poco código. Para el tamaño de la plataforma, no es la opción con menos código.
- **Decisión:** el servidor se organiza en `controlador → servicio → repositorio`, con clases que reciben sus dependencias por el constructor. Se arman a mano en `src/lib/container.ts`. Las reglas de cada capa están en [arquitectura](../architecture.md#capas-del-proyecto).
- **Consecuencias:** hay más archivos y algunos métodos solo reenvían la llamada. A cambio, los servicios se prueban con dependencias falsas, sin Astro ni base de datos. Better Auth consulta sus tablas con su propio adaptador de Drizzle, sin repositorio; solo las consultas propias pasan por uno. Los scripts de `scripts/` quedan fuera de las capas.
