# Diseño: antes del primer despliegue

Prepara el punto 8 de la Fase 0 del [roadmap](../../roadmap.md). Es un cambio pequeño.

## Intención

Que `/login` salga a producción con límite de intentos y que la administradora vea los 3 departamentos, que es la condición de cierre de la Fase 0.

## Alcance

Entra: el límite de intentos, la lista de departamentos en `/admin` y la documentación afectada.

No entra: el despliegue, las variables en Netlify ni el respaldo (siguen después). Tampoco límite en el cambio de contraseña (exige sesión), bloqueo por usuario ni CAPTCHA, ni más datos de cada departamento.

## Restricciones

Capas `controlador → servicio → repositorio`, sin funciones exclusivas de Netlify, formularios que funcionan sin JavaScript y sin dependencias nuevas.

## Enfoques para el límite

| Enfoque | A favor | En contra |
| --- | --- | --- |
| **A. Límite de Better Auth guardado en la base (elegido)** | Ya está instalado; no ata a un proveedor | Una tabla nueva; el acceso cambia de `auth.api` a `auth.handler`; limita solo por IP |
| B. Límite de Netlify | Frena la petición antes de la app | Específico del proveedor y difícil de aplicar solo a `/login` |
| C. Sin límite | Sin trabajo | Permite probar contraseñas sin freno |

## Límite de intentos

- `auth-options.ts`: `rateLimit` con `enabled: true`, `storage: 'database'` y la regla `/sign-in/username`: 5 intentos con ventana de 60 s. Cuentan también los accesos correctos. `enabled` va explícito porque por defecto solo se activa si Better Auth detecta producción.
- Tabla `rateLimit` (`key` única, `count`, `lastRequest` en `bigint`) en `src/lib/schema/rate-limit.ts`, agregada a `db.ts` y al adaptador de `auth.ts`, con su migración.
- `AuthService.login` llama a `auth.handler` con una petición a `/api/auth/sign-in/username`, porque `auth.api` no aplica el límite. Conserva los headers de la petición original y las cookies de la respuesta.
- IP: la Action y el endpoint `/api/auth/[...all]` escriben `context.clientAddress` en el header `x-client-ip`, **reemplazando** lo que mande el cliente. `advanced.ipAddress.ipAddressHeaders` es `['x-client-ip']`. En Netlify, el adaptador llena `clientAddress` con la IP del visitante; en otro hosting la da su adaptador.
- `/sign-in/email` se agrega a `disabledPaths`: la app no lo usa, el correo de `admin` es público en el repositorio y tendría su propio contador.
- Mensajes: al pasar el límite, "Demasiados intentos. Espera un minuto e inténtalo de nuevo."; con credenciales malas, el de hoy; con un error 5xx, el genérico.
- Se quita el comentario `shortcut:` de `auth.ts`.

## Lista de departamentos

`UnitRepository` los lee ordenados por `sort_order`, un `UnitService` los expone desde `container.ts` y `/admin` muestra sus nombres en una lista. Solo lectura. La ruta ya está protegida por el middleware.

## Riesgos aceptados

- Un ataque repartido entre muchas IP no se frena; la defensa ahí es una contraseña fuerte.
- Varias personas con la misma IP comparten el contador.
- Con `auth.handler`, Better Auth revisa el origen de las peticiones con cookies: hay que entrar por la misma URL que `BETTER_AUTH_URL`.

## Comprobación

- `pnpm check`, `pnpm build` y `node --test tests/*.test.mjs` pasan. Las pruebas de `login` cubren el header de IP reemplazado y las respuestas 429 y 401.
- En `dev`, tras migrar: `admin` entra, `/admin` muestra los 3 departamentos y el sexto intento seguido muestra el mensaje de límite. También con JavaScript desactivado.
- En producción (en el despliegue): se repite y se revisa que la clave en `rate_limit` o `rateLimit` tenga la IP real y no `no-trusted-ip`.

## A cargo de quien lo construya

Nombres internos y de columnas, siguiendo `src/lib/schema/`, y cómo el servicio informa a la Action el tipo de error.
