# Modelo de datos

> Describe el diseño previsto. Hoy solo existe el esqueleto de Astro.

Los montos se guardan en centavos (enteros) y las fechas en UTC. Se muestran en la zona `America/Mexico_City`.

| Tabla | Campos principales | Notas |
| --- | --- | --- |
| `user`, `session`, `account`, `verification` | Las crea Better Auth, más `username`, `role` (`admin` o `tenant`), `phone` (WhatsApp) y `must_change_password` | Solo la administradora puede crear inquilinos. El correo es solo para la administradora. |
| `file` | `id`, `provider`, `key`, `mime_type`, `size_bytes`, `created_at` | Registro de cada archivo. Las demás tablas la referencian y `/api/files/[id]` usa su `id`. Nunca guarda la URL del proveedor. |
| `unit` | `name`, `wifi_ssid`, `wifi_password_enc`, `notes` | Un registro por departamento (3). |
| `lease` | `unit_id`, `tenant_id`, `start_date`, `end_date`, `rent_cents`, `deposit_cents`, `status`, `original_file_id`, `signed_file_id`, `original_sha256`, `signed_at`, `signer_ip`, `signer_user_agent` | `status`: borrador, por firmar, firmado, terminado. Solo puede haber un contrato activo por departamento (ver "Contratos"). |
| `charge` | `lease_id`, `period` (AAAA-MM), `concept`, `amount_cents`, `due_date`, `receipt_file_id`, `status` | `concept`: renta, depósito, luz, agua, internet, otro. `receipt_file_id` apunta al recibo de CFE o de agua. `status`: pendiente, en revisión, pagado. |
| `payment` | `lease_id`, `amount_cents`, `proof_file_id`, `status`, `reviewed_by`, `reviewed_at`, `note`, `created_at` | `status`: en revisión, confirmado, rechazado. |
| `payment_charge` | `payment_id`, `charge_id` | Una transferencia puede cubrir varios cargos. |
| `maintenance_report` | `unit_id`, `created_by`, `title`, `description`, `status`, `admin_note`, `resolved_at` | `status`: recibido, en proceso, resuelto. |
| `report_photo` | `report_id`, `file_id` | Máximo 5 fotos por reporte. |

## Contratos

- **Activo:** por firmar o firmado. Un índice único parcial por departamento garantiza que haya como máximo uno.
- **Vigente:** firmado y con la fecha actual (`America/Mexico_City`) entre `start_date` y `end_date`. Es la condición para ver el WiFi.
- **Renovación:** exige terminar antes el contrato anterior.
- El inquilino conserva la descarga de sus contratos terminados.

## Reparto del agua

El recibo se divide en centavos enteros entre los departamentos ocupados. Los centavos sobrantes se reparten de uno en uno, según el orden de los departamentos. La suma de las partes debe ser igual al recibo, salvo un ajuste manual confirmado por la administradora.

## Pagos

En el MVP no hay pagos parciales: el monto del pago es la suma de los cargos elegidos.

Solo se pueden elegir cargos en estado pendiente. La comprobación y el cambio a "en revisión" ocurren en la misma transacción, y si algún cargo ya no está pendiente se rechaza el envío completo. Así, un reenvío del formulario no duplica el pago y un cargo nunca está en dos pagos en revisión.

| Evento | `payment.status` | `charge.status` de sus cargos |
| --- | --- | --- |
| El inquilino sube el comprobante | en revisión | en revisión |
| La administradora confirma | confirmado | pagado |
| La administradora rechaza | rechazado | pendiente |
