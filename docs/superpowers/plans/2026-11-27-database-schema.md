# Base de datos, esquema y primera migración — Plan de implementación

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Cerrar el punto 2 de la fase 0: esquema completo con Drizzle, primera migración probada en Docker y aplicada en Neon.

**Architecture:** El esquema vive en `src/lib/schema/` y la conexión en `src/lib/db.ts`. `drizzle-kit generate` produce SQL versionado en `drizzle/`; se prueba en Docker y la persona dueña del proyecto lo aplica a mano en Neon.

**Tech Stack:** PostgreSQL 17, `drizzle-orm@^0.45.4`, `drizzle-kit@^0.31.11`, `pg@^8.23.1`, `@types/pg`, `better-auth@^1.7.28`, CLI `auth@1.7.28`.

**Spec:** `docs/superpowers/specs/2026-11-26-database-schema-design.md`

## Global Constraints

- Solo pnpm. Node 24. Sin Python.
- `pnpm check` y `pnpm build` pasan antes de dar por terminado un cambio.
- Solo `src/lib/` habla con la base. Sin funciones exclusivas de Netlify.
- Tablas, columnas y valores en inglés; documentación en español neutro.
- Todas las tablas tienen `id serial` primario, salvo `payment_charge` (llave compuesta). Las FK son `integer`.
- `public_id uuid NOT NULL UNIQUE DEFAULT gen_random_uuid()` en `user`, `unit`, `file`, `lease`, `charge`, `payment`, `maintenance_report`, y en ninguna otra.
- Montos en `integer` (centavos); instantes en `timestamptz`; `start_date`, `end_date`, `due_date` en `date`.
- El rol de inquilino es `renter`; no se usa `tenant`.
- La cadena de Neon nunca se pega en el chat ni se guarda en un archivo. La migración en Neon la ejecuta la persona dueña del proyecto.
- No se resuelven otras preguntas de `docs/open-questions.md`.
- Commits en formato Conventional Commits, en la rama `dev`, sin push.

## Review Focus

1. `$env:DATABASE_URL` queda apuntando a Neon en la terminal → un `db:migrate` "local" tocaría producción. Se espera que la guía la borre al terminar (tarea 4).
2. Existe `.env` local y se define la variable en la terminal → debe ganar la de la terminal; si no, se "migraría producción" sobre Docker. Se prueba (tarea 2, paso 5).
3. Falta `DATABASE_URL` → `astro:env` debe fallar nombrando la variable, no dejar que `pg` use sus valores por defecto (tarea 1, paso 5).
4. El ajuste manual del esquema de auth pierde o renombra un campo que Better Auth espera → se compara con la salida de su CLI (tarea 1, paso 4). La inserción real se prueba en el punto 3.
5. Un contrato `terminated` o `draft` no debe bloquear un contrato activo nuevo en el mismo departamento (tarea 2, paso 6).

## Variables de entorno

Según la [guía de Astro](https://docs.astro.build/en/guides/environment-variables/):

| Quién lee | Cómo |
| --- | --- |
| La app (`src/lib/db.ts`) | `astro:env/server`, con `DATABASE_URL` declarada en `env.schema` como secreto de servidor |
| `drizzle.config.ts` (fuera de Astro) | `process.env`, cargando `.env` con `process.loadEnvFile()` |
| CLI de Better Auth (fuera de Astro) | No necesita variables: su configuración no importa `db.ts` |

`astro:env` es un módulo virtual: nada que carguen esas CLI puede importar `db.ts`.

---

### Task 1: Conexión y tablas de Better Auth

**Files:**
- Create: `src/lib/db.ts`, `src/lib/auth-options.ts`, `auth.cli.ts` (raíz), `src/lib/schema/auth.ts`
- Modify: `astro.config.mjs`, `package.json`, `pnpm-lock.yaml`, `.env.example` (comentario sobre `DATABASE_URL`)

**Interfaces:**
- Produces: `db` (instancia de Drizzle) desde `src/lib/db.ts`; `authOptions` desde `src/lib/auth-options.ts`; tablas `user`, `session`, `account`, `verification` y `roleEnum` desde `src/lib/schema/auth.ts`.
- El punto 3 creará `src/lib/auth.ts` con `betterAuth({ ...authOptions, database: drizzleAdapter(db, ...) })`.
- Los imports de `auth.cli.ts` y del esquema son relativos: las CLI no tienen por qué resolver los alias de `tsconfig`.

- [ ] **Step 1: Instalar dependencias**

```powershell
pnpm add drizzle-orm@^0.45.4 pg@^8.23.1 better-auth@^1.7.28
```

```powershell
pnpm add -D drizzle-kit@^0.31.11 @types/pg@^8.23.1
```

Si pnpm bloquea algún script de instalación, revisarlo antes de agregarlo a `allowBuilds`.

- [ ] **Step 2: Declarar la variable y crear `src/lib/db.ts`**

En `astro.config.mjs`, importar `envField` desde `astro/config` y agregar:
`env: { schema: { DATABASE_URL: envField.string({ context: 'server', access: 'secret' }) } }`.
Las demás variables se declaran en el punto que las use.

`db.ts`: `import { DATABASE_URL } from 'astro:env/server'` y `export const db = drizzle(new Pool({ connectionString: DATABASE_URL }), { schema })` con `drizzle-orm/node-postgres`. El `schema` es el de auth (se crea en el paso 4); la tarea 2 le suma el de negocio.

- [ ] **Step 3: `src/lib/auth-options.ts` y `auth.cli.ts`**

`export const authOptions = {...} satisfies BetterAuthOptions`, sin importar `db.ts`, con solo:
- `plugins: [username()]` desde `better-auth/plugins`.
- `advanced: { database: { generateId: 'serial' } }`.
- `user.additionalFields`: `role` (`type: ['admin', 'renter']`, `defaultValue: 'renter'`, `input: false`), `phone` (`type: 'string'`, `required: false`), `mustChangePassword` (`type: 'boolean'`, `defaultValue: true`, `input: false`).

Sin `database`, `emailAndPassword`, handler ni secretos: son del punto 3.

`auth.cli.ts`, solo para la CLI: `export const auth = betterAuth(authOptions)`.

- [ ] **Step 4: Generar la referencia y escribir `src/lib/schema/auth.ts`**

La salida va a la carpeta scratchpad de la sesión (o cualquier carpeta temporal fuera del repo). Con `--adapter` y `--dialect` no hace falta conectar una base.

```powershell
pnpm dlx auth@1.7.28 generate --config auth.cli.ts --adapter drizzle --dialect postgresql --output "$env:TEMP\auth-schema.ts" -y
```

Copiar la salida a `src/lib/schema/auth.ts` conservando tablas, nombres de propiedades, columnas (snake_case), índices, nulabilidad y `onDelete`. Ajustar solo:
1. IDs: `generateId: 'serial'` (paso 3) es la opción que le indica a Better Auth que la base genera IDs numéricos. Si la salida ya usa `serial("id")`, no se toca. La [documentación](https://www.better-auth.com/docs/concepts/database) dice que genera IDs numéricos autoincrementales, pero el [código del generador en 1.7.28](https://github.com/better-auth/better-auth/blob/v1.7.28/packages/cli/src/generators/drizzle.ts) emite `integer("id").generatedByDefaultAsIdentity()`; en ese caso, cambiarlo a `serial("id")` en las 4 tablas. Las FK quedan `integer`.
2. Todo `timestamp(...)` con `{ withTimezone: true }`.
3. `role` pasa de `text` a `roleEnum = pgEnum('user_role', ['admin', 'renter'])`, `notNull`, default `'renter'`.
4. `mustChangePassword`: columna `must_change_password`, `notNull`, default `true`.
5. Agregar a `user`: `publicId: uuid('public_id').notNull().unique().defaultRandom()`.

Comparar después ambos archivos: no hay más diferencias que esas. Si la salida difiere de lo que describe este paso (por ejemplo, falta un campo), detenerse y avisar.

- [ ] **Step 5: Verificar**

Run: `pnpm check` y `pnpm build`
Expected: 0 errores.

Prueba de la conexión y de la variable: crear temporalmente el endpoint `src/pages/db-check.ts`, que ejecute `select 1` con `db`, y levantar el servidor con la herramienta de vista previa (`pnpm dev`) con la base de Docker activa. Pedir `/db-check`:
- Con `DATABASE_URL` en `.env`: responde bien (Astro carga `.env`).
- Sin la variable en `.env` ni en la terminal: error que nombra `DATABASE_URL`.

Si ya existe `.env`, no sobrescribirlo ni mostrar su contenido; pedir a la persona que haga el cambio. Al terminar, borrar el endpoint y el `.env` temporal.

- [ ] **Step 6: Commit**

`feat: agregar la conexión a la base y las tablas de Better Auth`. Incluye también el spec y este plan si siguen sin versionar, en un commit aparte: `docs: agregar el diseño y el plan de la base de datos`.

---

### Task 2: Esquema del negocio y primera migración en Docker

**Files:**
- Create: `src/lib/schema/app.ts`, `drizzle.config.ts`, `drizzle/` (generado), `tests/schema-check.sql`
- Modify: `src/lib/db.ts` (sumar el esquema de negocio), `package.json` (scripts)

**Interfaces:**
- Consumes: `user` de `./auth`.
- Produces: `file`, `unit`, `lease`, `charge`, `payment`, `paymentCharge`, `maintenanceReport`, `reportPhoto`; enums `lease_status`, `charge_concept`, `charge_status`, `payment_status`, `report_status`; scripts `db:generate` y `db:migrate`.

- [ ] **Step 1: `src/lib/schema/app.ts`**

Nombres SQL en snake_case y propiedades en camelCase. En todas: `created_at timestamptz NOT NULL DEFAULT now()`. `id` y `public_id` según Global Constraints. FK del negocio con `onDelete: 'restrict'`. Todo es `NOT NULL` salvo lo marcado con `?`.

| Tabla | Columnas propias |
| --- | --- |
| `file` | `provider text`, `key text`, `mime_type text`, `size_bytes integer`; único (`provider`, `key`) |
| `unit` | `name text`, `sort_order integer` único, `wifi_ssid text?`, `wifi_password_enc text?`, `notes text?` |
| `lease` | `unit_id`→unit, `renter_id`→user, `start_date date`, `end_date date`, `rent_cents integer`, `deposit_cents integer`, `status lease_status` = `draft`, `original_file_id?`→file, `signed_file_id?`→file, `original_sha256 text?`, `signed_at timestamptz?`, `signer_ip text?`, `signer_user_agent text?` |
| `charge` | `lease_id`→lease, `period text`, `concept charge_concept`, `amount_cents integer`, `due_date date`, `receipt_file_id?`→file, `status charge_status` = `pending` |
| `payment` | `lease_id`→lease, `amount_cents integer`, `proof_file_id`→file, `status payment_status` = `in_review`, `reviewed_by?`→user, `reviewed_at timestamptz?`, `note text?` |
| `payment_charge` | `payment_id`→payment, `charge_id`→charge; PK compuesta; sin `id` |
| `maintenance_report` | `unit_id`→unit, `created_by`→user, `title text`, `description text`, `status report_status` = `received`, `admin_note text?`, `resolved_at timestamptz?` |
| `report_photo` | `report_id`→maintenance_report, `file_id`→file |

Valores de los enums: los de la tabla "Valores permitidos" del spec.

Restricciones:
- `uniqueIndex('lease_one_active_per_unit')` en `unit_id` con `WHERE status IN ('pending_signature','signed')`.
- `check`: `rent_cents >= 0`, `deposit_cents >= 0`, `charge.amount_cents >= 0`, `payment.amount_cents >= 0`, `end_date >= start_date`, `period ~ '^[0-9]{4}-(0[1-9]|1[0-2])$'`.

No se agregan índices para consultas que aún no existen.

- [ ] **Step 2: `drizzle.config.ts` y scripts**

`defineConfig({ dialect: 'postgresql', schema: './src/lib/schema/*.ts', out: './drizzle', dbCredentials: { url: process.env.DATABASE_URL! } })`. Antes: `if (existsSync('.env')) process.loadEnvFile();`.

Scripts: `"db:generate": "drizzle-kit generate"`, `"db:migrate": "drizzle-kit migrate"`.

- [ ] **Step 3: Generar y revisar el SQL**

Run: `pnpm db:generate --name init`
Expected: `drizzle/0000_init.sql` y `drizzle/meta/`.

Revisar en el SQL: 12 `CREATE TABLE`; `"id" serial PRIMARY KEY` en 11; `public_id` en exactamente 7 tablas; ningún `timestamp` sin zona; el índice parcial con su `WHERE`; los 6 checks (sin parámetros `$1` en el SQL); ninguna aparición de `tenant`.

- [ ] **Step 4: Migrar una base local vacía**

Se usa una base nueva `rentas_check`, para no borrar nada del volumen existente.

```bash
docker compose exec -T db createdb -U rentas rentas_check
DATABASE_URL=postgres://rentas:rentas@localhost:5432/rentas_check pnpm db:migrate
```

Expected: termina sin errores. Si `rentas_check` ya existe, preguntar antes de borrarla.

- [ ] **Step 5: Comprobar que la variable de la terminal gana a `.env`**

Si no existe `.env`, crear uno temporal con `DATABASE_URL=postgres://rentas:rentas@localhost:1/rentas` (puerto inválido) y borrarlo al terminar. Si ya existe, no modificarlo: la prueba vale si apunta a otra base distinta de `rentas_check`; si no, avisar.

Run: el comando `db:migrate` del paso 4.
Expected: termina bien (usó la variable de la terminal, no la del archivo).

- [ ] **Step 6: `tests/schema-check.sql`**

Script dentro de `BEGIN … ROLLBACK` que, con datos ficticios, crea un usuario `renter` y un departamento, y usa bloques `DO` que lanzan una excepción si lo prohibido se acepta:
- Con contratos `terminated` y `draft` en el departamento, se acepta uno `signed`.
- Con ese `signed`, un segundo `pending_signature` en el mismo departamento falla con `unique_violation`.
- `period = '2026-13'` falla con `check_violation`.
- Borrar el departamento con contratos falla con `foreign_key_violation`.
- El usuario insertado sin indicar `role`, `must_change_password` ni `public_id` queda con `renter`, `true` y un UUID.

Run:

```bash
docker compose exec -T db psql -U rentas -d rentas_check -v ON_ERROR_STOP=1 < tests/schema-check.sql
```

Expected: código de salida 0 y termina en `ROLLBACK`. Para confirmar que la prueba puede fallar, ejecutar una vez una copia temporal que espere `unique_violation` en el contrato `signed` válido: debe fallar.

- [ ] **Step 7: Migrar la base local de trabajo, borrar la de prueba y verificar**

```bash
DATABASE_URL=postgres://rentas:rentas@localhost:5432/rentas pnpm db:migrate
docker compose exec -T db dropdb -U rentas rentas_check
pnpm db:generate
pnpm check
pnpm build
```

Expected: `db:generate` informa que no hay cambios; `check` y `build` pasan. Si `rentas` ya tenía tablas con esos nombres, detenerse y preguntar.

- [ ] **Step 8: Commit**

`feat: definir el esquema con Drizzle y la primera migración`

---

### Task 3: Documentación

**Files:**
- Modify: `docs/data-model.md`, `docs/security.md`, `docs/decisions/005-better-auth-username.md`, `docs/decisions/007-cloudinary-private-files.md`, `docs/architecture.md`, `docs/roadmap.md`, `docs/design.md`, `docs/open-questions.md`, `CLAUDE.md`, `README.md`

- [ ] **Step 1: Aplicar la sección "Documentación a actualizar" del spec**

Además:
- `CLAUDE.md`: agregar a Reglas: "En URL y formularios se usa `public_id`, nunca `id`." y "Plataforma de un solo cliente con varios inquilinos; no es multi-tenant. El rol de inquilino es `renter`."
- `docs/security.md`: la excepción de contratos terminados usa `renter_id`; el endpoint busca por `public_id`.
- `docs/open-questions.md`: quitar las tres entradas resueltas (orden de departamentos, campos de fecha, versión de PostgreSQL).
- `README.md`: estado actual, `db:generate` y `db:migrate` en la tabla de scripts, cómo migrar en local y en Neon (los comandos de la tarea 4) y quitar "El esqueleto todavía no usa la base de datos" solo en lo que ya no sea cierto.

- [ ] **Step 2: Verificar**

Buscar `tenant` y `[id]` en el repo, fuera de `docs/superpowers/` y `node_modules/`.
Expected: solo quedan las menciones a "multi-tenant" que niegan serlo.

- [ ] **Step 3: Commit**

`docs: actualizar la documentación con el esquema de la base`

---

### Task 4: Neon (la ejecuta la persona dueña del proyecto)

**Files:**
- Modify: `docs/roadmap.md` (solo al confirmar la migración)

Claude guía y no crea la cuenta, no acepta términos y no recibe la cadena de conexión.

- [ ] **Step 1: Crear cuenta y proyecto** en <https://console.neon.tech>:
  - **Postgres version: 17** (el valor por defecto es 18).
  - **Región: AWS US East 2 (Ohio)**, `aws-us-east-2`. Coincide con la región por defecto de las funciones de Netlify en sitios nuevos (`cmh`). No se puede cambiar después.
  - No activar servicios extra, como la autenticación de Neon: se usa Better Auth en la app.

- [ ] **Step 2: Copiar la conexión directa.** En "Connect", desactivar "Connection pooling". El host **no** debe contener `-pooler`. No pegarla en el chat.

- [ ] **Step 3: Migrar** desde PowerShell, en la carpeta del proyecto. Cada línea se ejecuta por separado.

```powershell
$env:DATABASE_URL = Read-Host "Pega la conexión directa de Neon"
```

```powershell
pnpm db:migrate
```

```powershell
Remove-Item Env:DATABASE_URL
```

La última se ejecuta siempre, aunque la migración falle.

- [ ] **Step 4: Confirmar** en el SQL Editor de Neon:

```sql
select version();
select count(*) from information_schema.tables where table_schema = 'public';
select count(*) from drizzle.__drizzle_migrations;
```

Expected: PostgreSQL 17, `12` y `1`.

- [ ] **Step 5:** Con esos tres resultados confirmados, marcar el punto 2 en `docs/roadmap.md` y hacer commit: `docs: marcar la base de datos como lista`.

La cadena agrupada (`-pooler`) para la app se configura en el punto del despliegue en Netlify.
