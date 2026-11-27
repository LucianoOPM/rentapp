# File Storage Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Guardar archivos privados en Cloudinary y descargarlos por `/api/files/[publicId]` con permisos por rol.

**Architecture:** `storage.ts` es el único adaptador de Cloudinary. `FileService` decide el acceso con las referencias que le da `FileRepository` y el contrato que le da `LeaseService.getActiveLease`. Una función pura, `fileResponse`, traduce el resultado a HTTP y el endpoint solo la llama.

**Tech Stack:** Astro 7, SDK `cloudinary` (v2), Drizzle, `node --test`.

**Spec:** [diseño](../specs/2026-11-27-file-storage-design.md)

## Global Constraints

- Solo pnpm. La única dependencia nueva es `cloudinary`. Sin migraciones.
- Todo se sube con `type: 'authenticated'` y `resource_type: 'raw'`. `provider` es `'cloudinary'`; la `key` es `plataforma-renta/<UUID>.<extensión>`.
- Tipos admitidos: `application/pdf` (`pdf`), `image/jpeg` (`jpg`), `image/png` (`png`), `image/webp` (`webp`).
- Ningún error ni log incluye la URL firmada ni las credenciales.
- La regla de recibos, comprobantes y fotos es provisional; no se cierran las preguntas abiertas.
- Alias `@` en `src/`; rutas relativas en `tests/` y `scripts/`. En lo que carga Node: sin *parameter properties* ni `enum`, y los alias solo en `import type`.
- Commits (Conventional Commits) solo si el usuario los pide.

## Review Focus

- Inquilino con contraseña temporal que abre un enlace de archivo: 403.
- `publicId` en mayúsculas es válido; texto que no es UUID da 404 sin consultar la base.
- Cloudinary responde con error (por ejemplo, PDF bloqueado): 502 sin URL en la respuesta ni en el error.
- `fetch` falla por red con un mensaje que contiene la URL: el error que sale de `storage.ts` no la contiene.
- Archivo vacío: `upload` lo rechaza sin llamar a Cloudinary.

---

### Task 1: Adaptador de almacenamiento

**Files:** Create `src/lib/storage.ts`, `tests/storage.test.mjs`, `scripts/check-storage.mjs`. Modify `package.json`, `pnpm-lock.yaml`.

**Interfaces:** Produces:

- `type StorageConfig = { cloudName: string; apiKey: string; apiSecret: string }`
- `class CloudinaryStorage`, `constructor(config: StorageConfig, fetchFn: typeof fetch = fetch)`
- `upload(bytes: Uint8Array, mimeType: string): Promise<{ provider: 'cloudinary'; key: string }>`
- `get(key: string): Promise<ReadableStream<Uint8Array>>`
- `remove(key: string): Promise<void>`
- `extensionFor(mimeType: string): string | undefined`
- `parseCloudinaryUrl(url: string): StorageConfig`

- [ ] `pnpm add cloudinary`.
- [ ] Incluir las pruebas de `parseCloudinaryUrl`: `cloudinary://1:secreto@Demo` da `{ cloudName: 'Demo', apiKey: '1', apiSecret: 'secreto' }`; otro protocolo, una parte faltante o texto que no es URL lanzan, y ni el mensaje ni las propiedades del error contienen `secreto` (`new URL` guarda la entrada en su error: no propagarlo).
- [ ] Escribir las pruebas con credenciales falsas (`demo`, `1`, `secreto`) y un `fetchFn` falso, sin red:
  - `get pide una URL firmada y devuelve el contenido`: la URL pedida cumple `/^https:\/\/res\.cloudinary\.com\/demo\/raw\/authenticated\/s--[\w-]{8}--\//` y termina en la `key` (se ignora la query); el flujo devuelve los bytes del `fetch` falso.
  - `get no filtra la URL si Cloudinary responde 401`: rechaza, y `String(error) + error.cause` no contiene `cloudinary.com` ni `s--`.
  - `get no filtra la URL si falla la red`: `fetchFn` lanza `new Error(url)`; mismas aserciones.
  - `upload rechaza un tipo no admitido` (`image/heic`) y `upload rechaza un archivo vacío`: ambos rechazan antes de tocar la red.
- [ ] `node --test tests/storage.test.mjs`: falla porque el módulo no existe.
- [ ] Implementar. Las credenciales van en las opciones de cada llamada (`cloud_name`, `api_key`, `api_secret`), sin `cloudinary.config()`. Subida con `uploader.upload_stream` (`public_id` = key, `overwrite: false`); URL con `utils.url(key, { resource_type: 'raw', type: 'authenticated', sign_url: true, secure: true })`; borrado con `uploader.destroy(key, { resource_type: 'raw', type: 'authenticated', invalidate: true })`, que lanza si `result` no es `ok` ni `not found`. Los errores propios llevan como mucho el código HTTP, sin `cause`.
- [ ] La prueba pasa.
- [ ] Crear `scripts/check-storage.mjs`: carga `.env` como `create-test-user.mjs` y lee `CLOUDINARY_URL` con `parseCloudinaryUrl`; sube un PDF y un PNG mínimos; compara los bytes de `get`; pide la URL sin firma (`.../raw/authenticated/<key>`) y exige que no responda 200; llama a `remove` en `finally` y confirma que `get` falla después. Imprime una línea por comprobación, sin URL, y termina con código distinto de 0 si algo falla.

### Task 2: Permisos

**Files:** Create `src/lib/repositories/file-repository.ts`, `src/lib/repositories/lease-repository.ts`, `src/lib/services/lease-service.ts`, `src/lib/services/file-service.ts`, `tests/file-service.test.mjs`.

**Interfaces:** Consumes `CloudinaryStorage.get` (como `Pick<CloudinaryStorage, 'get'>`, solo tipo). Produces:

- `type FileRecord = { id: number; publicId: string; key: string; mimeType: string }`
- `type FileReference = { kind: 'lease'; renterId: number; status: LeaseStatus } | { kind: 'charge' | 'payment'; leaseId: number } | { kind: 'photo'; unitId: number; createdBy: number }`
- `FileRepository { findByPublicId(publicId: string): Promise<FileRecord | null>; findReferences(fileId: number): Promise<FileReference[]> }`, implementada por `DrizzleFileRepository(db)`
- `type ActiveLease = { id: number; unitId: number; status: LeaseStatus }`
- `LeaseRepository { findActiveByRenter(renterId: number): Promise<ActiveLease[]> }` (`pending_signature` o `signed`), implementada por `DrizzleLeaseRepository(db)`
- `type Viewer = { id: string | number; role?: string | null }`
- `LeaseService(leases).getActiveLease(user: Viewer): Promise<ActiveLease | null>`; lanza si hay más de uno
- `FileService(files, leaseService, storage)`: `findAccessible(user: Viewer, publicId: string): Promise<FileRecord | null>` y `open(file: FileRecord): Promise<ReadableStream<Uint8Array>>`

- [ ] Escribir las pruebas con repositorios falsos y el `LeaseService` real:
  - `la administradora abre un archivo sin referencias` y `un inquilino no`.
  - `contrato propio`: permitido en `pending_signature`, `signed` y `terminated`; negado en `draft`; negado si `renterId` es de otro.
  - `recibo y comprobante`: para `charge` y `payment`, permitido solo con contrato activo `signed` y mismo `leaseId`; negado con `pending_signature`, sin contrato activo (terminado) y con otro `leaseId`.
  - `recibo compartido`: dos referencias `charge`, una ajena y una propia: permitido.
  - `foto`: permitida con contrato `signed`, mismo `unitId` y `createdBy` propio; negada si la creó el inquilino anterior, si es de otro departamento y con `pending_signature`.
  - `dos contratos activos`: `findAccessible` rechaza incluso para un contrato propio.
  - `un rol distinto de admin se trata como inquilino` (`role: null`).
  - `un publicId que no es UUID no consulta la base` (devuelve `null` con cero llamadas) y `un UUID en mayúsculas sí`.
- [ ] `node --test tests/file-service.test.mjs`: falla porque el módulo no existe.
- [ ] Implementar. `findReferences` hace cuatro consultas: `lease` por `originalFileId` o `signedFileId`; `charge` por `receiptFileId`; `payment` por `proofFileId`; `reportPhoto` unida a `maintenanceReport` por `fileId`. Los servicios usan solo `import type`. `user.id` llega como texto desde Better Auth: comparar con `Number(user.id)`.
- [ ] La prueba pasa.

### Task 3: Endpoint, configuración y documentación

**Files:** Create `src/lib/file-response.ts`, `src/pages/api/files/[publicId].ts`, `tests/file-response.test.mjs`. Modify `src/lib/container.ts`, `astro.config.mjs`, `.env.example`, `CLAUDE.md`, `docs/architecture.md`, `docs/security.md`, `docs/decisions/007-cloudinary-private-files.md`, `docs/open-questions.md` (solo anotar la regla provisional en las dos preguntas), `docs/roadmap.md` (solo si pasa la comprobación real).

**Interfaces:** Consumes `FileService`, `extensionFor`. Produces `fileResponse(files: Pick<FileService, 'findAccessible' | 'open'>, user: (Viewer & { mustChangePassword?: boolean | null }) | null, publicId: string): Promise<Response>` y `fileService` en `container.ts`. Como `file-response.ts` lo carga Node, recibe además `extensionFor` como cuarto parámetro para no importar `storage.ts`.

- [ ] Escribir las pruebas con un `files` falso:
  - sin usuario: 401; `mustChangePassword: true`: 403; en ambos no se llama a `findAccessible`.
  - `findAccessible` devuelve `null`: 404.
  - `open` lanza: 502, y el cuerpo no contiene el mensaje del error.
  - permitido (`application/pdf`): 200, mismos bytes, `content-type: application/pdf`, `content-disposition: inline; filename="<publicId>.pdf"`, `cache-control: private, no-store`, `x-content-type-options: nosniff`.
- [ ] `node --test tests/file-response.test.mjs`: falla.
- [ ] Implementar `fileResponse`; en el 502, `console.error` con el `publicId` y el mensaje del error de `storage.ts` (que ya viene sin URL). Un error de `findAccessible` no se atrapa. El endpoint exporta `GET` y pasa `locals.user` y `params.publicId`.
- [ ] Declarar `CLOUDINARY_URL` en `astro.config.mjs` (`envField.string`, `context: 'server'`, `access: 'secret'`, `min: 1`), armar `CloudinaryStorage` con `parseCloudinaryUrl(CLOUDINARY_URL)`, repositorios y servicios en `container.ts`. En `.env.example`, reemplazar las tres variables `CLOUDINARY_*` por `CLOUDINARY_URL=` vacía, con un comentario sobre su formato, de dónde sale y el ajuste de PDF. Actualizar la lista de variables de `docs/architecture.md`.
- [ ] Actualizar la documentación listada.
- [ ] `node --test tests/*.test.mjs`, `pnpm check` y `pnpm build` pasan.
- [ ] **Requiere credenciales del usuario:** `node scripts/check-storage.mjs` pasa en todas sus líneas.
- [ ] **Requiere credenciales del usuario:** con `pnpm dev` y la rama `dev`, comprobar sin sesión (401) y UUID inexistente con sesión (404); con un archivo temporal subido y su fila en `file`, un 200 como administradora y un 404 como inquilino sin referencia. Luego referenciarlo desde un contrato temporal del inquilino y esperar 200. Borrar las filas y el archivo temporales. Pedir permiso antes de escribir en la base.
- [ ] Marcar el punto 5 del roadmap solo si las dos comprobaciones reales pasan.
