-- Comprobación de las reglas del esquema. No deja datos: todo termina en ROLLBACK.
-- pnpm db:check
BEGIN;

INSERT INTO "user" (name, email) VALUES ('Prueba', 'schema-check@example.test');
INSERT INTO unit (name, sort_order) VALUES ('Prueba', -1);

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM "user"
    WHERE email = 'schema-check@example.test'
      AND role = 'renter' AND must_change_password AND public_id IS NOT NULL
  ) THEN
    RAISE EXCEPTION 'los valores por defecto de user no son los esperados';
  END IF;
END $$;

-- Un contrato terminado o en borrador no bloquea uno activo.
INSERT INTO lease (unit_id, renter_id, start_date, end_date, rent_cents, deposit_cents, status)
SELECT u.id, p.id, '2026-01-01', '2026-12-31', 100, 0, s::lease_status
FROM unit u, "user" p, unnest(ARRAY['terminated', 'draft', 'signed']) AS s
WHERE u.sort_order = -1 AND p.email = 'schema-check@example.test';

DO $$
BEGIN
  INSERT INTO lease (unit_id, renter_id, start_date, end_date, rent_cents, deposit_cents, status)
  SELECT unit_id, renter_id, start_date, end_date, rent_cents, deposit_cents, 'pending_signature'
  FROM lease WHERE status = 'signed' AND unit_id = (SELECT id FROM unit WHERE sort_order = -1);
  RAISE EXCEPTION 'se aceptó un segundo contrato activo';
EXCEPTION WHEN unique_violation THEN NULL;
END $$;

DO $$
BEGIN
  INSERT INTO charge (lease_id, period, concept, amount_cents, due_date)
  SELECT id, '2026-13', 'rent', 100, '2026-12-05'
  FROM lease WHERE status = 'signed' AND unit_id = (SELECT id FROM unit WHERE sort_order = -1);
  RAISE EXCEPTION 'se aceptó el periodo 2026-13';
EXCEPTION WHEN check_violation THEN NULL;
END $$;

DO $$
BEGIN
  DELETE FROM unit WHERE sort_order = -1;
  RAISE EXCEPTION 'se borró un departamento con contratos';
EXCEPTION WHEN foreign_key_violation OR restrict_violation THEN NULL;
END $$;

ROLLBACK;
