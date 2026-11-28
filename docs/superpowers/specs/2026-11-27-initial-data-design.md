# Diseño: datos iniciales

Cierra el punto 7 de la Fase 0 del [roadmap](../../roadmap.md). Es un cambio pequeño.

## Intención

Que `dev`, `production` y cualquier base nueva tengan los 3 departamentos y la cuenta de la administradora al correr `pnpm db:migrate`, sin un script de carga.

## Alcance

Entra: una migración SQL de datos, las instrucciones en el `README.md` y el estado en el roadmap.

No entra:

- La lista de departamentos en `/admin`. La Fase 0 la necesita para cerrarse y hoy ningún punto del roadmap la incluye.
- Variables en Netlify, despliegue y respaldo (punto 8).
- Los datos de WiFi y las notas de cada departamento.

## Restricción

El repositorio es público: la migración no lleva datos reales ni contraseñas en texto plano.

## Enfoques

| Enfoque | A favor | En contra |
| --- | --- | --- |
| **A. Todo en una migración SQL (elegido)** | Sin código nuevo; se aplica con el comando de siempre | El hash de la contraseña temporal queda público |
| B. SQL para los departamentos y script para la cuenta | El hash no se publica | Un paso manual más en cada base |
| C. Script para todo | Puede leer variables de entorno | Más código |

Se eligió A. `drizzle-seed` se descartó: sirve para generar datos y añade una dependencia.

## Migración

Se crea con `pnpm db:generate --custom --name=seed-initial-data`.

| Tabla | Datos |
| --- | --- |
| `unit` | `Departamento 1`, `Departamento 2` y `Departamento 3`, con `sort_order` 1, 2 y 3 |
| `user` | `name` `Administradora`; `username` y `display_username` `admin`; `email` `admin@sin-correo.invalid`; `role` `admin` |
| `account` | `provider_id` `credential`, `account_id` igual al `id` del usuario, `password` con el hash y `updated_at` (no tiene valor por defecto en la base) |

`must_change_password` queda en su valor por defecto, verdadero.

Sin `ON CONFLICT`: si ya hay un dato que choca, la migración falla y no aplica nada, en lugar de dejar una carga a medias o conservar datos de prueba. Antes de aplicarla en una base, se revisa que no tenga departamentos ni el usuario `admin`.

El correo ficticio reemplaza lo previsto en el [diseño del acceso](2026-11-27-auth-first-access-design.md), que era usar `ADMIN_EMAIL`. La app no lee el correo del usuario y los avisos van a la variable `ADMIN_EMAIL`.

## Contraseña temporal

La genera quien opera el proyecto, en su terminal, con un comando que crea una contraseña aleatoria de 24 caracteres y su hash con `hashPassword` de `better-auth/crypto`. En el archivo solo va el hash. La contraseña se guarda fuera del repositorio.

## Riesgos aceptados

- Con el hash público, la protección depende de que la contraseña sea aleatoria. No se sustituye por una elegida a mano.
- `dev` y `production` comparten la contraseña temporal hasta cambiarla en cada una. En producción se cambia en cuanto la app esté disponible.
- Una base nueva vuelve a crear la cuenta con la contraseña temporal.
- Una migración aplicada no se edita: las correcciones van en otra migración.

## Comprobación

- `pnpm check`, `pnpm build` y `node --test tests/*.test.mjs` pasan.
- En `dev`: `pnpm db:migrate` aplica la migración; hay 3 departamentos; `admin` entra, se le pide cambiar la contraseña y llega a `/admin`.
- Producción se migra a mano, con los pasos del `README.md`. El punto 7 se marca en el roadmap cuando los datos estén allí.
