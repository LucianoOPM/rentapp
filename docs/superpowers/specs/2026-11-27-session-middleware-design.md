# Diseño: middleware de sesión y protección de rutas

Cierra el punto 4 de la Fase 0 del [roadmap](../../roadmap.md). Es un cambio pequeño. Aprobado.

## Intención

Leer la sesión en un solo lugar, proteger `/admin` y `/app` por rol, obligar el cambio de la contraseña temporal y renovar la cookie de sesión.

## Alcance

Entra: `src/middleware.ts`, las reglas de acceso con pruebas, los tipos de `App.Locals`, páginas provisionales en `/admin` y `/app`, y la actualización de las páginas actuales y la documentación.

No entra: las pantallas reales, `getActiveLease`, las Actions de administración (cada una revisará el rol: el middleware protege rutas, no Actions), la cuenta de la administradora ni el límite de intentos.

## Enfoques

| Enfoque | A favor | En contra |
| --- | --- | --- |
| **A. Un middleware (elegido)** | Un solo lugar; lo pide `architecture.md` | |
| B. Revisar la sesión en cada página | No hay middleware | Es fácil olvidarlo en una página nueva |

## Comportamiento

- El middleware lee la sesión, guarda `locals.user` y pasa a la respuesta las cookies que renueve Better Auth. No actúa sobre `/api/auth/*`.
- Las reglas son una función pura que usa `context.routePattern`, para no depender de cómo se escriba la URL.
- En Astro, las Actions de formulario corren después del middleware: si redirige, la Action no se ejecuta.

| Caso | Resultado |
| --- | --- |
| Sin sesión en `/admin`, `/app` (y subrutas) o `/cambiar-contrasena` | `/login` |
| Con contraseña temporal en `/`, `/admin` o `/app` | `/cambiar-contrasena` |
| Rol equivocado | Redirige a su propia área |
| `/` | `/admin`, `/app` o `/login`, según la sesión |

`/admin` y `/app` muestran un saludo y el botón de cerrar sesión.

## Comprobación

`node --test`, `pnpm check` y `pnpm build` pasan. En `dev` se prueban las redirecciones por HTTP.
