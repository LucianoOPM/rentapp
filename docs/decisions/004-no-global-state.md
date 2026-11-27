# 004 — Sin manejador de estado global

**Estado:** aceptada (26 nov 2026)

**Decisión en breve:** Sin manejador de estado global

**Descartado:** nanostores, Zustand

- **Contexto:** los datos los genera el servidor en cada página, y las islas no comparten estado.
- **Decisión:** no se instala nanostores ni Zustand. Si llega a hacer falta, se agrega nanostores.
