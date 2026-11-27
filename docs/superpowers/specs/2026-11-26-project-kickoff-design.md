# Diseño: patada inicial del proyecto

Fecha: 2026-11-26

## Intención

Convertir `Plataforma de rentas — Documentación inicial.md` en la documentación base del repositorio y dejar un proyecto que arranque, para comenzar la Fase 0.

## Objetivos

- Documentación en `docs/`, con nombres de archivo en inglés y contenido en español.
- Archivos de arranque del repositorio y esqueleto de Astro funcionando.

## Fuera de alcance

Base de datos, Drizzle, autenticación, middleware, Cloudinary, Resend, despliegue y pantallas del producto.

## Enfoques

- **A. Solo preparar el repositorio:** más rápido, pero no hay nada que ejecutar.
- **B. A más el esqueleto de Astro (elegido):** cubre la primera tarea de la Fase 0 y permite comprobar que el stack funciona.

## Entregables

### Documentación

- `docs/overview.md`: resumen, alcance y stack
- `docs/architecture.md`: capas, firma, WiFi, variables de entorno
- `docs/data-model.md`
- `docs/security.md`: permisos y manejo de archivos
- `docs/roadmap.md`
- `docs/design.md`: pantallas, flujos y lineamientos de interfaz
- `docs/costs.md`
- `docs/decisions/`: `README.md` como índice y un archivo por decisión (001 a 015)
- `docs/open-questions.md`: lo que siga sin decidir

El documento original se conserva sin cambios.

### Repositorio

- `README.md`, `CLAUDE.md`, `.gitignore`, `.env.example`, `.nvmrc` (Node 24)
- `git init`, sin commits hasta que se pidan

### Esqueleto

- Proyecto creado con las herramientas oficiales de Astro: TypeScript estricto, Tailwind, React y `@astrojs/netlify`, con `output: 'server'`.
- Solo una página de inicio mínima, en español.
- Sin carpetas ni módulos vacíos para fases futuras.

## Verificación

`npm run build` y la revisión de tipos terminan sin errores, `npm run dev` responde en `/`, y `.gitignore` excluye `.env`.

## Recomendaciones (aprobadas el 2026-11-26)

Se integran en la documentación.

1. **Subidas:** tope de unos 4 MB por petición y `security.actionBodySizeLimit` acorde (por defecto es 1 MB). Las fotos se reducen en el navegador como mejora progresiva. Sin JavaScript, el formulario funciona si los archivos caben. El PDF original se limita a 3.5 MB para dejar margen al PDF firmado. Netlify admite unos 4.5 MB de datos binarios por petición.
2. **Archivos:** tabla `file` (`id`, `provider`, `key`, `mime_type`, `size_bytes`, `created_at`). Las demás tablas la referencian y `/api/files/[id]` usa su `id`.
3. **Correo:** empezar sin dominio, con `onboarding@resend.dev` y la cuenta de Resend registrada con el mismo correo que `ADMIN_EMAIL`. Resend lo considera solo para pruebas; para producción recomienda verificar un dominio.
4. **Contrato:** "activo" significa por firmar o firmado, con un índice único parcial por departamento. "Vigente" significa firmado y con la fecha actual (`America/Mexico_City`) entre inicio y fin; es la condición para ver el WiFi. Una renovación exige terminar antes el contrato anterior. El inquilino conserva la descarga de sus contratos terminados.
5. **Agua:** dividir en centavos enteros y repartir los sobrantes de uno en uno, según el orden de los departamentos. La suma debe ser igual al recibo, salvo ajuste manual confirmado por la administradora.
6. **Pagos:** agregar `created_at` a `payment`. Definir en `charge.status`: pendiente, en revisión, pagado. Sin pagos parciales en el MVP: el monto es la suma de los cargos elegidos, y un rechazo los regresa a pendiente.

## A criterio de quien construya

Redacción y organización interna de cada documento, y versiones concretas de las dependencias (las estables vigentes).
