-- Datos iniciales. La contraseña temporal de `admin` se cambia en el primer acceso de cada base.
-- Aquí va solo su hash: este repositorio es público.
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
SELECT "id"::text, 'credential', "id", '9a63daa101fe750248f520682dd02742:73fe3cc8f5c071e06a53cc55be3e046a7fc89156e746f1dfb05551efae182271f46f108f2dc7034e2e0cef939bbe2b0212982b887f4a5e00d0ba682d65288449', now() FROM "admin_user";
