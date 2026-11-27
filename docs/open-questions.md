# Preguntas abiertas

## Por confirmar con la propietaria

- **Pagos parciales:** el MVP no los admite. Si los inquilinos suelen abonar en partes, hay que cambiar esta regla antes de construir los pagos.
- **Renovaciones:** hoy exigen terminar el contrato anterior, así que no se puede firmar una renovación por adelantado. ¿Hace falta?
- **Dominio propio:** ¿se comprará uno para dejar el remitente de pruebas de Resend antes de usar la plataforma en producción?
- **Historial al renovar:** al terminar un contrato, `getActiveLease` deja de mostrar sus cargos pendientes, comprobantes en revisión e historial de pagos, y el WiFi se corta hasta que el nuevo contrato esté firmado y vigente. ¿Qué debe seguir viendo el inquilino y qué pasa con los adeudos? Resolver antes de construir los pagos.
- **Contrato por firmar:** el flujo habilita el estado de cuenta después de la firma, pero ese contrato ya cuenta como activo. ¿Qué puede ver el inquilino antes de firmar?
- **Fechas del contrato:** ¿`start_date` y `end_date` son inclusivas? De eso depende el WiFi el último día.
- **Departamentos ocupados:** para repartir el agua, ¿son los que tienen contrato activo o contrato vigente?

## Legal

- Revisión por un abogado de la cláusula de aceptación de la firma electrónica ([decisión 008](decisions/008-simple-esignature.md)).

## Técnicas

- **Fotos sin JavaScript:** cinco fotos de celular sin reducir casi nunca caben en el límite por envío. ¿Se acepta esa limitación o se permite enviar menos fotos por vez?
- Respaldo con `pg_dump`: falta definir la frecuencia, dónde se ejecuta y dónde se guarda.
- El adaptador de Netlify activa las sesiones de Astro sobre Netlify Blobs. No usar `Astro.session`, o cambiar su almacenamiento, para cumplir la [decisión 015](decisions/015-portability-rules.md).

## Sin verificar

- Los límites y precios de [costos](costs.md) y las afirmaciones sobre otros proveedores en las [decisiones](decisions/README.md), salvo la cuota de correos de Resend.
