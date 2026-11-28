# Diseño: acceso y cambio obligatorio de contraseña

Cierra el punto 3 de la Fase 0 del [roadmap](../../roadmap.md). Es un cambio pequeño.

## Intención

Que un usuario ya creado pueda entrar con usuario y contraseña, y que en su primer acceso se le pida cambiar la contraseña temporal. Todo con el menor código posible y sin servicio de correo.

## Punto de partida

`src/lib/auth-options.ts` ya tiene el plugin `username` y los campos `role`, `phone` y `mustChangePassword`. Las tablas ya están migradas. No existe una instancia conectada a la base, ni endpoint, ni pantallas. No se necesita ninguna migración ni dependencia nueva.

## Alcance

Entra: instancia de Better Auth, endpoint `/api/auth/[...all]`, `/login`, `/cambiar-contrasena`, cerrar sesión y un script para crear un usuario de prueba en `dev`.

No entra:

- Middleware, `locals.user`, roles y protección de `/admin` y `/app` (punto 4). Hasta entonces, quien tenga sesión puede salir de `/cambiar-contrasena` sin cambiar la contraseña.
- Cuenta de la administradora y datos iniciales (punto 7).
- Variables en Netlify (punto 8).
- Alta y restablecimiento de inquilinos (Fase 1).
- Verificación de correo, recuperación de contraseña y cualquier envío de correo.

## Enfoques

| Enfoque | A favor | En contra |
| --- | --- | --- |
| **A. Astro Actions (elegido)** | Funciona sin JavaScript y sigue `architecture.md` | Hay que trasladar la cookie de sesión desde la Action |
| B. `POST` procesado en la página `.astro` | Menos archivos | Mezcla validación y vista, y se aparta de la arquitectura |

Descartados: enviar el formulario a `/api/auth` (responde JSON) y una isla de React (requiere JavaScript).

## Configuración

- `src/lib/auth.ts`: instancia de Better Auth con el adaptador de Drizzle, sobre `db` de `src/lib/db.ts`.
- En `auth-options.ts`: acceso con contraseña activado, registro cerrado (`disableSignUp`) y mínimo de 8 caracteres.
- Por HTTP se desactivan `/change-password` (para que el cambio pase siempre por la app y se actualice `mustChangePassword`), `/update-user` (el inquilino no edita su cuenta) y `/is-username-available` (revela qué usuarios existen). Las llamadas desde el servidor no se ven afectadas.
- `BETTER_AUTH_SECRET` (mínimo 32 caracteres) y `BETTER_AUTH_URL` se declaran en `astro.config.mjs` y se explican en `.env.example`.
- La duración de la sesión queda con el valor por defecto de Better Auth.

## Pantallas y Actions

Se siguen los lineamientos de [diseño](../../design.md): una columna de 480 px como máximo, texto de 16 px, botones de 44 px, textos en español y campos con etiqueta.

| Elemento | Comportamiento |
| --- | --- |
| `/login` | Usuario y contraseña. Si `mustChangePassword` es verdadero, lleva a `/cambiar-contrasena`; si no, a `/`. |
| `/cambiar-contrasena` | Contraseña actual, nueva y confirmación. Sin sesión, lleva a `/login`. La nueva debe tener 8 caracteres o más, coincidir con la confirmación y ser distinta de la actual. Al guardar, cierra las demás sesiones, pone `mustChangePassword` en falso y lleva a `/`. |
| `/` | Con sesión muestra el nombre y el botón "Cerrar sesión"; sin sesión, un enlace a `/login`. Es provisional hasta el punto 4. |
| Actions | `login`, `changePassword` y `logout`. Validan con Zod, llaman a la capa de dominio y trasladan la cookie. |

La lógica del cambio de contraseña (llamar a Better Auth y actualizar la marca) vive en `src/lib/`, para que las Actions no hablen con la base. Si la contraseña cambia pero falla la actualización de la marca, se pedirá cambiarla otra vez.

## Errores

- Acceso fallido: siempre "Usuario o contraseña incorrectos", sin indicar cuál falló.
- Cambio fallido: un mensaje que dice qué corregir.
- Un fallo inesperado muestra un mensaje genérico, sin detalles internos.
- Las contraseñas nunca se devuelven al formulario ni se registran.

## Correo y usuarios

La tabla `user` exige un `email` único. A quien no tenga correo se le genera `<usuario>@sin-correo.invalid`; ese dominio está reservado y no recibe mensajes. La administradora usará `ADMIN_EMAIL` en el punto 7.

Como el registro queda cerrado, un script de `scripts/` crea el usuario de prueba desde el servidor, con `mustChangePassword` en verdadero. Es solo para `dev`: recibe los datos al ejecutarlo y no guarda contraseñas en el repositorio.

## Límite de intentos (pendiente aceptado)

Better Auth solo limita las peticiones HTTP a `/api/auth`. Las llamadas desde las Actions no pasan por ese límite, así que `/login` queda sin límite de intentos. Se acepta por ahora, con el mínimo de 8 caracteres. Las contraseñas temporales serán aleatorias cuando se construya el alta. Se anota con un comentario `shortcut:` en el código y en [preguntas abiertas](../../open-questions.md), para resolverlo antes del primer despliegue.

## Comprobación

- `pnpm check`, `pnpm build` y `pnpm db:check` pasan.
- En `dev`, sin JavaScript: acceso fallido; primer acceso que lleva al cambio; rechazo de una contraseña corta, sin coincidencia o igual a la actual; cambio correcto; cierre de sesión; la contraseña anterior ya no sirve y la nueva lleva a `/`.
- El registro y las tres rutas desactivadas se rechazan por HTTP.
- Al terminar se actualizan el roadmap, `README.md`, `CLAUDE.md` y `architecture.md` con el estado real.

## A criterio de quien lo construya

La forma de trasladar la cookie, el nombre del script, el reparto de archivos dentro de `src/lib/` y `src/actions/`, y los textos exactos.
