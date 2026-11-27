# Archivos privados en Cloudinary: diseño

Punto 5 de la fase 0 del [roadmap](../../roadmap.md). Fecha: 27 nov 2026. Estado: aprobado.

## Propósito

Guardar y descargar archivos privados sin que el navegador reciba nunca una URL de Cloudinary. La administradora y los inquilinos descargan por el mismo endpoint.

**Fuera de alcance:** pantallas y formularios de subida, alta de registros en `file`, límite de tamaño de las Actions, variables en Netlify y optimización de fotos.

## Enfoques

| Enfoque | A cambio | Resultado |
| --- | --- | --- |
| **A. SDK oficial y URL de entrega firmada** | Una dependencia; la URL no vence | **Elegido.** Cumple la decisión 007 y las firmas las calcula el SDK. |
| B. API HTTP con `fetch` y `node:crypto` | Mantener las firmas a mano | Descartado: ahorra poco y arriesga la seguridad. |
| C. SDK y `private_download_url` | Según la documentación, el doble de ancho de banda y sin caché de CDN | Descartado: la URL no sale del servidor, así que el vencimiento aporta poco. |

## Almacenamiento (`src/lib/storage.ts`)

Es el único archivo que importa `cloudinary`. Recibe las credenciales por el constructor, sin `astro:env`, para poder usarlo desde Node.

- `upload(bytes, mimeType)` devuelve `{ provider, key }`.
- `get(key)` pide la URL firmada y devuelve el contenido como flujo.
- `remove(key)` borra el archivo.
- Todo se guarda con `type: 'authenticated'` y `resource_type: 'raw'`, para conservar los bytes originales.
- La `key` es `plataforma-renta/<UUID>.<extensión>`.
- Tipos admitidos: PDF, JPEG, PNG y WebP. Cualquier otro se rechaza.
- Ningún error ni log incluye la URL firmada.

## Permisos

Siguen `controlador → servicio → repositorio`. `FileRepository` busca el archivo y los registros que lo referencian. `FileService` decide. `getActiveLease(user)` se crea ahora: devuelve el contrato por firmar o firmado del inquilino.

La administradora descarga cualquier archivo registrado. Para un inquilino:

| Referencia | Se permite si |
| --- | --- |
| Contrato (original o firmado) | El `renter_id` es el suyo y el contrato está por firmar, firmado o terminado |
| Recibo de un cargo | El cargo es de su contrato activo y ese contrato está firmado |
| Comprobante de pago | El pago es de su contrato activo y ese contrato está firmado |
| Foto de un reporte | Su contrato activo está firmado, el reporte es de ese departamento y él lo creó |

- Basta con que una referencia autorice. Así funciona el recibo de agua compartido.
- Un archivo sin referencias solo lo descarga la administradora.
- "Firmado" es el estado del contrato, sin revisar fechas. La condición de "vigente" solo aplica al WiFi.
- La regla para recibos y comprobantes es **provisional y estricta**. No cierra las preguntas abiertas "Historial al renovar" ni "Contrato por firmar".
- El modelo no impide que un inquilino tenga dos contratos activos en departamentos distintos. En ese caso, `getActiveLease` falla y no se entrega nada.

## Endpoint (`GET /api/files/[publicId]`)

| Caso | Respuesta |
| --- | --- |
| Sin sesión | 401 |
| Contraseña temporal sin cambiar | 403 (el middleware no cubre esta ruta) |
| `publicId` que no es UUID, archivo inexistente o sin permiso | 404, para no revelar si existe |
| Falla Cloudinary | 502, sin detalles del proveedor |
| Permitido | 200 con el contenido reenviado |

La respuesta lleva el `Content-Type` guardado en `file`, `Content-Disposition: inline` con el nombre `<publicId>.<extensión>`, `Cache-Control: private, no-store` y `X-Content-Type-Options: nosniff`.

## Configuración

- `CLOUDINARY_URL` (`cloudinary://<api_key>:<api_secret>@<cloud_name>`, tal como la entrega Cloudinary) se declara en `astro.config.mjs` como secreto obligatorio. **Sin ella la app no arranca.** Reemplaza a las tres variables previstas antes.
- `storage.ts` la interpreta y le pasa las credenciales al SDK; no depende de que el SDK la lea de `process.env`. Si el formato es inválido, el error no incluye el valor.
- Pasos manuales: crear la cuenta, copiar la variable a `.env` y activar **Allow delivery of PDF and ZIP files** en Settings → Security.

## Comprobación

- Pruebas con `node --test` y dependencias falsas: cada fila de las dos tablas, incluidos los casos negados.
- `scripts/check-storage.mjs`, contra la cuenta real: sube un PDF y una imagen, compara los bytes descargados, confirma que sin firma no se pueden abrir y los borra.
- Prueba manual del endpoint en la rama `dev` de Neon, para cubrir las consultas.
- `pnpm check` y `pnpm build`.
- El punto del roadmap se marca solo cuando pase la comprobación contra la cuenta real. No se ha confirmado cómo se comporta `raw` con URL firmadas; si falla, se revisa este diseño.

## Documentación a actualizar

La decisión 007 (nota sobre `raw`: se pierde la optimización de fotos en Cloudinary), el estado descrito en `architecture.md`, `security.md` y `CLAUDE.md`, los comentarios de `.env.example` y el roadmap.
