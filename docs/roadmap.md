# Roadmap

El proyecto avanza en tres fases, y solo se pasa a la siguiente cuando se cumple su condición de cierre. No hay fechas fijas: el ritmo lo marca el tiempo disponible.

## Fase 0 — Base técnica

Se cierra cuando la administradora puede entrar con su usuario y contraseña y ver sus 3 departamentos en producción.

- [x] Crear el proyecto de Astro con TypeScript, Tailwind, la integración de React y el adaptador de Netlify. Agregar .nvmrc y .env.example.
- [x] Crear la base de datos de producción en Neon (en desarrollo se usa [la rama `dev` de Neon](decisions/016-neon-dev-branch.md)), definir el esquema con Drizzle y correr la primera migración.
- [x] Configurar Better Auth con el plugin `username`, los campos `role` y `phone`, y el cambio obligatorio de contraseña en el primer acceso.
- [x] Escribir el middleware de sesión y la protección de `/admin` y `/app`.
- [x] Configurar Cloudinary (activar la entrega de PDFs y subir todo con type authenticated), escribir el módulo storage.ts y el endpoint `/api/files/[publicId]` que reenvía los archivos.
- [x] Configurar Resend: registrar la cuenta con el correo de `ADMIN_EMAIL` y usar `onboarding@resend.dev` como remitente mientras no haya dominio propio ([detalles](architecture.md#correo)).
- [x] Cargar los datos iniciales: los 3 departamentos y la cuenta de la administradora.
- [ ] Hacer el primer despliegue en Netlify con las variables de entorno y programar un respaldo periódico con pg\_dump.

## Fase 1 — MVP

Se cierra cuando un inquilino real firma su contrato, paga un mes completo y levanta un reporte usando solo la plataforma.

- [ ] Inquilinos: la administradora los da de alta con usuario, WhatsApp y contraseña temporal, los asigna a un departamento y puede restablecer su contraseña.
- [ ] Contratos: subir el PDF, firmar con el dedo, generar el PDF firmado y descargarlo.
- [ ] Cargos: crear los cargos del mes (renta, luz, agua), adjuntar el recibo de CFE de cada departamento y repartir el recibo de agua, que es uno solo, entre los departamentos ocupados.
- [ ] Pagos: el inquilino sube su comprobante SPEI y la administradora lo confirma o lo rechaza.
- [ ] Estado de cuenta del inquilino: saldo, cargos pendientes e historial.
- [ ] Reportes de mantenimiento con fotos y estados.
- [ ] WiFi: la administradora guarda la contraseña y el inquilino la ve y la copia.
- [ ] Correos a la administradora por comprobantes y reportes nuevos, y botones "Avisar por WhatsApp" con el mensaje ya escrito para los inquilinos.

## Fase 2 — Ajustes con uso real

Se cierra cuando los 3 departamentos llevan dos meses usando la plataforma sin volver a WhatsApp para pagos ni reportes.

- [ ] Recibo de pago en PDF al confirmar un pago.
- [ ] Botón "Recordar por WhatsApp" para cargos vencidos.
- [ ] Aviso en el panel de los contratos que vencen en menos de 60 días.
- [ ] Internet como concepto de cargo, cuando se decida incluirlo.
- [ ] Lo que pidan la administradora y los inquilinos después del primer mes.

## Después, solo si hace falta

Pagos con tarjeta u OXXO, cargos mensuales automáticos, la API de Omada para el WiFi, constancia NOM-151, facturación CFDI y avisos automáticos con la API de WhatsApp.
