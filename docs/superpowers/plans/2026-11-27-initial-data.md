# Datos iniciales: plan de implementación

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Que `pnpm db:migrate` cargue los 3 departamentos y la cuenta de la administradora.

**Architecture:** Una migración SQL personalizada de Drizzle. El hash de la contraseña temporal se genera fuera del repositorio y se pega en el archivo.

**Tech Stack:** drizzle-kit 0.31, PostgreSQL (Neon), `hashPassword` de `better-auth/crypto`.

**Spec:** [diseño](../specs/2026-11-27-initial-data-design.md)

## Global Constraints

- El repositorio es público: ni datos reales ni contraseñas en texto plano, tampoco en este plan, en los commits o en el chat.
- Sin código nuevo en `src/` ni en `scripts/`, y sin dependencias nuevas.
- Sin `ON CONFLICT`.
- Commits en formato Conventional Commits, solo cuando el usuario lo pida. La PR va contra `dev`.
- Producción la migra el usuario, a mano.

## Review Focus

- La base ya tiene departamentos o el usuario `admin`: se revisa antes; si se aplica igual, falla sin guardar nada.
- Se pega la contraseña en lugar del hash: el archivo se revisa contra el formato `<hex>:<hex>` antes de migrar.
- `.env` apunta a producción al probar en `dev`: se confirma el host antes de migrar.
- Hash mal copiado o incompleto: el acceso de `admin` en `dev` lo detecta antes de tocar producción.

---

### Task 1: Migración de datos

**Files:**
- Create: `drizzle/0001_seed-initial-data.sql` (lo genera drizzle-kit)
- Modify: `drizzle/meta/_journal.json`, `drizzle/meta/0001_snapshot.json` (los genera drizzle-kit)
- Modify: `README.md` (estado y sección "Datos iniciales")

- [ ] **Step 1:** Generar el archivo vacío: `pnpm db:generate --custom --name=seed-initial-data`. Esperado: aparece `drizzle/0001_seed-initial-data.sql`.

- [ ] **Step 2:** El usuario genera la contraseña y su hash en su terminal (PowerShell), guarda la contraseña fuera del repositorio y comparte solo el hash:

```powershell
node -e "import('better-auth/crypto').then(async c=>{const p=require('node:crypto').randomBytes(18).toString('base64url');console.log('Contraseña: '+p);console.log('Hash: '+await c.hashPassword(p))})"
```

- [ ] **Step 3:** Escribir el SQL, con `<HASH>` reemplazado:

```sql
INSERT INTO "unit" ("name", "sort_order") VALUES
	('Departamento 1', 1),
	('Departamento 2', 2),
	('Departamento 3', 3);
--> statement-breakpoint
WITH "admin_user" AS (
	INSERT INTO "user" ("name", "username", "display_username", "email", "role")
	VALUES ('Administradora', 'admin', 'admin', 'admin@sin-correo.invalid', 'admin')
	RETURNING "id"
)
INSERT INTO "account" ("account_id", "provider_id", "user_id", "password", "updated_at")
SELECT "id"::text, 'credential', "id", '<HASH>', now() FROM "admin_user";
```

- [ ] **Step 4:** Comprobar el formato del hash. Buscar en el archivo `'[0-9a-f]{32}:[0-9a-f]{128}'`: debe haber una coincidencia y no quedar `<HASH>`.

- [ ] **Step 5:** Revisar `dev` antes de migrar, con una consulta de solo lectura (`node -e` con `pg`, cargando `.env`). Mostrar el host de la base, y los conteos de `unit` y de usuarios con `username = 'admin'` o ese correo. Confirmar con el usuario que el host es el de `dev`. Esperado: conteos en 0. Si no, preguntar antes de borrar nada.

- [ ] **Step 6:** `pnpm db:migrate`. Esperado: termina sin errores. Repetir la consulta: 3 departamentos y 1 usuario `admin`, con `role = 'admin'`, `must_change_password = true` y una fila en `account`.

- [ ] **Step 7:** En `dev`, con `pnpm dev`, el usuario entra como `admin` (la contraseña la escribe él), cambia la contraseña y llega a `/admin`.

- [ ] **Step 8:** `README.md`: agregar "Datos iniciales" (la migración crea los departamentos y la cuenta `admin`; en cada base se cambia la contraseña temporal en el primer acceso; en producción se aplica con los pasos de "Migraciones en producción", cambiando la contraseña en cuanto la app esté disponible) y actualizar "Estado actual". Aclarar que `create-test-user.mjs` sirve para inquilinos de prueba.

- [ ] **Step 9:** `pnpm check`, `pnpm build` y `node --test tests/*.test.mjs`. Esperado: sin errores ni fallos.

- [ ] **Step 10:** Cuando el usuario lo pida, commit: `feat: cargar los datos iniciales`.

### Task 2: Producción y cierre

**Files:**
- Modify: `docs/roadmap.md:15`

- [ ] **Step 1:** El usuario activa en `.env` la conexión de producción, revisa que no tenga departamentos ni el usuario `admin`, ejecuta `pnpm db:migrate` y vuelve a dejar activa la de `dev`, con los pasos del `README.md`.

- [ ] **Step 2:** Con la confirmación del usuario de que los datos están en producción, marcar el punto 7 en el roadmap (`- [x]`).
