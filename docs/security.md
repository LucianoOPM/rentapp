# Permisos y archivos

> Describe el diseño previsto. Hoy solo existen el esqueleto de Astro, el esquema de la base de datos, el acceso con usuario y contraseña, la protección de rutas por rol y el almacenamiento y la descarga de archivos (todavía sin pantallas para subirlos).

## Permisos

No hay Row Level Security, así que los permisos se revisan en el código:

- Toda consulta de un inquilino pasa por una función `getActiveLease(user)` y filtra por ese contrato o ese departamento. Nunca se usa un identificador que venga del formulario sin verificarlo. Las URL y los formularios usan `public_id`, nunca `id`.
- Las Actions de administración revisan `role === 'admin'` antes de hacer cualquier cosa.
- Los archivos se descargan solo por `/api/files/[publicId]`: el endpoint busca el `public_id` en la tabla `file`, revisa que el archivo pertenezca al usuario y descarga el archivo de Cloudinary con una URL firmada y se lo reenvía al navegador. Todos los archivos se suben con type authenticated, así que no se pueden abrir sin firma.

## Contratos y acceso

- "Activo" y "vigente" se definen en el [modelo de datos](data-model.md#contratos). El WiFi exige un contrato vigente.
- Excepción a la regla de `getActiveLease`: para descargar un contrato terminado se verifica que su `renter_id` sea el del usuario de la sesión.

## Archivos y secretos

- La tabla `file` no indica el dueño: `/api/files/[publicId]` lo determina por los registros que referencian el archivo (`lease`, `charge`, `payment`, `report_photo`) y aplica los permisos de ese registro. Si ninguna referencia autoriza al usuario, niega el acceso. Un recibo compartido, como el del agua, se permite si alguno de los cargos que lo referencian es accesible para el usuario.
- Para un inquilino, los recibos, los comprobantes y las fotos exigen que su contrato activo esté firmado; en las fotos, además, el reporte debe ser de ese departamento y haberlo creado él. La parte de recibos y comprobantes es provisional (ver [preguntas abiertas](open-questions.md)). El contrato propio se descarga en cualquier estado menos borrador.
- Sin sesión el endpoint responde 401; con la contraseña temporal, 403; sin permiso o si el archivo no existe, 404.
- Todo el acceso a archivos pasa por `src/lib/storage.ts` ([decisión 015](decisions/015-portability-rules.md)).
- El navegador nunca recibe una URL de Cloudinary ([decisión 007](decisions/007-cloudinary-private-files.md)).
- La contraseña de WiFi se guarda cifrada con AES-GCM, con la llave `WIFI_ENC_KEY`.
- Los secretos van en variables de entorno; `.env` no se versiona.
