# Diseño: base de datos, esquema y primera migración (Fase 0, punto 2)

**Estado:** aprobado.

## Intención

Dejar la base de producción en Neon con el esquema completo, definido con Drizzle y creado por una primera migración versionada. Sobre ese esquema se construyen los puntos siguientes del roadmap.

## Alcance

- **Incluye:** el proyecto de Neon, Drizzle, el esquema completo (Better Auth y negocio), `src/lib/db.ts`, la primera migración aplicada en Docker y en Neon, y la documentación afectada.
- **No incluye:** login, handler de Better Auth, middleware, datos iniciales, variables en Netlify, respaldos ni consultas de dominio. Son puntos posteriores.

## Enfoques

| Enfoque | Balance | Resultado |
| --- | --- | --- |
| A. `drizzle-kit generate` y `migrate` a mano | SQL revisable y versionado; hay que acordarse de aplicarlo | **Elegido** |
| B. Migrar en el build de Netlify | Sin pasos manuales; un build o una vista previa podría modificar producción | Descartado |
| C. `drizzle-kit push` | Rápido; no deja historial de migraciones | Descartado |

## Decisiones tuyas

- La primera migración incluye las tablas de Better Auth (`user`, `session`, `account`, `verification`) con `username`, `role`, `phone` y `must_change_password`.
- `unit` tiene `sort_order`, que define el orden para repartir los centavos del agua.
- Todas las tablas del negocio tienen `created_at`. Se mantienen `signed_at`, `reviewed_at` y `resolved_at`.
- No tienes cuenta de Neon: el plan incluye la guía y la cuenta la creas tú.
- Los `id` son `serial`, también en las tablas de Better Auth (`advanced.database.generateId: "serial"`).
- El `id` numérico no se expone en rutas. Las entidades que se acceden por una ruta tienen además un `public_id` UUID, por ejemplo `/contrato/<uuid>`.
- La plataforma es de un solo cliente con varios inquilinos; no es multi-tenant. Para evitar la confusión, el rol `tenant` pasa a `renter` y `lease.tenant_id` a `lease.renter_id`.

## Decisiones mías (corrígelas si no te cuadran)

### Piezas

- Driver `pg` con `drizzle-orm`, y `drizzle-kit` como dependencia de desarrollo.
- `src/lib/db.ts`: la conexión, con `DATABASE_URL` tomada de `astro:env/server` y declarada en `env.schema`. Las CLI, que corren fuera de Astro, usan `process.env` y no importan este archivo.
- `src/lib/schema/auth.ts` y `src/lib/schema/app.ts`: el esquema.
- `src/lib/auth-options.ts` (plugin `username`, IDs `serial` y los tres campos, sin conexión) y `auth.cli.ts` en la raíz, solo para generar las tablas con la CLI. El punto 3 crea `src/lib/auth.ts` con esas opciones y el adaptador de Drizzle.
- `drizzle.config.ts`, la carpeta `drizzle/` con el SQL, y los scripts `db:generate` y `db:migrate`.

### Convenciones

- Tablas, columnas y valores de estado en inglés. Los textos en español se resuelven en la interfaz.
- Todas las tablas usan `id serial` como llave primaria y las llaves foráneas apuntan a él. La excepción es `payment_charge`, con llave compuesta. Se comprueba que el esquema que genera la CLI de Better Auth cumpla esto.
- `public_id` (`uuid`, obligatorio, único y generado por la base): lo tienen `user`, `unit`, `file`, `lease`, `charge`, `payment` y `maintenance_report`. Son las entidades que una ruta o un formulario puede necesitar identificar (esta lista es decisión mía). No lo llevan `session`, `account`, `verification`, `payment_charge` ni `report_photo`.
- Las URL y los campos de formulario usan `public_id`, nunca `id`. Esto no reemplaza la revisión de permisos.
- Para el punto 3: la API de Better Auth puede devolver el `id` numérico del usuario en sus respuestas; ahí se revisa qué se expone al navegador.
- Montos en `integer` (centavos). Instantes en `timestamptz`.
- `start_date`, `end_date` y `due_date` son días de calendario (`date`, sin hora ni zona). `period` es texto `AAAA-MM` con validación.
- Las llaves foráneas del negocio impiden borrar una fila referenciada. Las de Better Auth quedan como las genere.
- `created_at` es obligatorio y su valor por defecto es el momento de inserción.

### Valores permitidos

| Campo | Valores |
| --- | --- |
| `user.role` | `admin`, `renter` (por defecto `renter`) |
| `lease.status` | `draft`, `pending_signature`, `signed`, `terminated` |
| `charge.concept` | `rent`, `deposit`, `power`, `water`, `internet`, `other` |
| `charge.status` | `pending`, `in_review`, `paid` |
| `payment.status` | `in_review`, `confirmed`, `rejected` |
| `maintenance_report.status` | `received`, `in_progress`, `resolved` |

### Reglas en la base

- Índice único parcial en `lease(unit_id)` cuando `status` es `pending_signature` o `signed`.
- `unit.sort_order` es obligatorio y único.
- `payment_charge` usa como llave primaria el par `payment_id` y `charge_id`.
- `file.key` es única por `provider`.
- Los montos no pueden ser negativos y `end_date` no puede ser anterior a `start_date`.
- `user.must_change_password` es `true` por defecto.
- Opcionales: `user.phone`, el WiFi y las notas de `unit`, los datos de firma y los archivos de `lease`, `charge.receipt_file_id`, los datos de revisión y la nota de `payment`, `admin_note` y `resolved_at`. Los demás campos del negocio son obligatorios.
- El máximo de 5 fotos y que un cargo no esté en dos pagos en revisión se controlan en el código, en la fase 1.

### Neon y producción

- PostgreSQL 17, igual que Docker. La región se elige cercana a la de las funciones de Netlify; el plan la confirma en la documentación.
- Para migrar se usa la conexión directa, no la agrupada (se confirma en la documentación al armar el plan).
- La cadena de producción nunca se pega en el chat ni se guarda en `.env`: se define en la terminal solo para ejecutar la migración, que haces tú.

## Verificación

- La migración corre sobre una base local vacía.
- En la base local se comprueba que el índice parcial rechaza un segundo contrato activo en el mismo departamento.
- `pnpm check` y `pnpm build` pasan.
- En Neon se confirma que existen las tablas y el registro de la migración.

## Documentación a actualizar

- `docs/data-model.md`: `id` y `public_id`, `sort_order`, `created_at`, los valores de estado y `renter`. La nota de `file` pasa a decir que la ruta usa `public_id`.
- `docs/security.md`: `renter_id` y el uso de `public_id` en `/api/files`.
- `docs/decisions/005-better-auth-username.md`: el rol `renter`.
- `docs/architecture.md`, `docs/roadmap.md`, `docs/design.md`, `docs/decisions/007-cloudinary-private-files.md` y `CLAUDE.md`: las rutas con `[id]` pasan a `[publicId]`.
- Los documentos de arranque en `docs/superpowers/` quedan como registro histórico.
- `docs/open-questions.md`: quitar el orden de departamentos, las fechas que faltan y la versión de PostgreSQL, ya resueltos.
- `README.md`: comandos de migración.
- `docs/roadmap.md`: marcar el punto solo cuando la migración esté aplicada en Neon.

## Preguntas que siguen abiertas

No resuelvo las demás de `docs/open-questions.md`. En particular, que las fechas del contrato sean inclusivas, los pagos parciales y las renovaciones siguen pendientes. Si cambian el esquema, se hará con otra migración.

Better Auth exige un correo en `user` y los inquilinos no dan uno. El esquema conserva el campo como lo define Better Auth; cómo llenarlo se decide en el punto 3.
