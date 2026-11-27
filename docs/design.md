# Diseño

El diseño parte del celular. Cada pantalla responde a una sola pregunta, como "¿cuánto debo?" o "¿cómo va mi reporte?", y la acción principal queda siempre a la vista.

## Pantallas del inquilino (`/app`)

| Ruta | Pantalla | Qué muestra y qué permite |
| --- | --- | --- |
| `/login` | Entrar | Pide usuario y contraseña. Si es el primer acceso, obliga a cambiar la contraseña temporal. |
| `/cambiar-contrasena` | Cambiar contraseña | Pide la contraseña actual, la nueva y su confirmación. Se llega al entrar con la contraseña temporal. |
| `/app` | Inicio | Saldo pendiente, próximo vencimiento, último reporte y accesos a las demás secciones. |
| `/app/cuenta` | Estado de cuenta | Cargos del mes con su recibo de CFE o agua, botón "Subir comprobante" (cubre el total de los cargos elegidos; en el MVP no hay pagos parciales) e historial de pagos. |
| `/app/contrato` | Contrato | El PDF y su estado. Si está por firmar, la casilla de aceptación y el recuadro de firma. Si ya está firmado, el botón de descarga. |
| `/app/reportes` | Mantenimiento | Lista de reportes con su estado y botón "Nuevo reporte" (título, descripción y hasta 5 fotos). |
| `/app/wifi` | WiFi | Nombre de la red y contraseña en letra grande, con botón "Copiar". |

## Pantallas de la administradora (`/admin`)

| Ruta | Pantalla | Qué muestra y qué permite |
| --- | --- | --- |
| `/admin` | Panel | Una tarjeta por departamento con inquilino, saldo, comprobantes por revisar y reportes abiertos, y un botón "Avisar por WhatsApp" con el mensaje ya escrito. |
| `/admin/departamentos/[publicId]` | Departamento | Inquilino y contrato, cargos y pagos, WiFi y reportes de ese departamento. |
| `/admin/inquilinos/nuevo` | Alta de inquilino | Nombre, usuario, WhatsApp y departamento. Genera una contraseña temporal y tiene un botón para enviarla por WhatsApp. Desde aquí también se restablece la contraseña. |
| `/admin/contratos/nuevo` | Nuevo contrato | Subir PDF, fechas, renta y depósito, y enviarlo a firma. |
| `/admin/cargos` | Cargos del mes | Formulario para los 3 departamentos a la vez: renta precargada, monto de luz y recibo de CFE de cada departamento, y un solo recibo de agua que se reparte en partes iguales entre los departamentos ocupados (cada parte se puede ajustar a mano). |
| `/admin/pagos` | Comprobantes | Lista de comprobantes en revisión, con botones "Confirmar" y "Rechazar" (este último pide un motivo). |
| `/admin/reportes` | Reportes | Todos los reportes. Permite cambiar el estado y dejar una nota para el inquilino. |

## Flujos clave

1. **Inquilino nuevo:** alta, la administradora manda por WhatsApp el enlace, el usuario y la contraseña temporal, primer acceso con cambio de contraseña, firma, y entonces se habilitan el WiFi y el estado de cuenta.
2. **Mes normal:** la administradora captura los cargos del mes, la administradora le avisa al inquilino por WhatsApp desde el botón, paga por SPEI y sube su comprobante, la administradora lo confirma y el cargo queda pagado.
3. **Reporte:** el inquilino lo levanta con fotos, la administradora recibe un correo, cambia el estado a "en proceso" y luego a "resuelto" con una nota.

## Lineamientos de interfaz

- Una sola columna, con un máximo de 480 px de ancho en el celular. El panel de la administradora puede usar dos columnas en pantallas grandes.
- Botones de al menos 44 px de alto y texto base de 16 px, para que el celular no haga zoom en los formularios.
- Barra de navegación inferior para el inquilino: Inicio, Cuenta, Reportes y WiFi. El contrato se abre desde Inicio.
- Los estados usan siempre los mismos colores y etiquetas: pendiente en ámbar, pagado o resuelto en verde, rechazado en rojo, y en revisión o en proceso en azul.
- Montos con formato `$8,500.00 MXN` y fechas como `5 dic 2026`.
- Todos los textos en español, tuteando al inquilino, con mensajes de error que dicen qué hacer.
- Los formularios funcionan aunque JavaScript no cargue. La firma es la única excepción.
- Archivos: unos 4 MB como máximo por envío y 3.5 MB para el PDF del contrato. Con JavaScript, las fotos se reducen antes de subirse; sin él, el envío funciona si los archivos caben.
- Si se rechaza un comprobante, sus cargos vuelven a pendiente.
