import { z } from 'astro/zod';

// En Actions de formulario, un campo vacío llega como `null`; por eso cada tipo lleva su mensaje.
const required = (message: string) =>
  z.string({ error: message }).min(1, message).max(128, 'La contraseña no puede pasar de 128 caracteres.');

export const changePasswordInput = z
  .object({
    currentPassword: required('Escribe tu contraseña actual.'),
    newPassword: required('Escribe tu nueva contraseña.').min(8, 'La nueva contraseña debe tener al menos 8 caracteres.'),
    confirmPassword: required('Repite tu nueva contraseña.'),
  })
  .refine((v) => v.newPassword === v.confirmPassword, {
    path: ['confirmPassword'],
    message: 'Las contraseñas no coinciden.',
  })
  .refine((v) => v.newPassword !== v.currentPassword, {
    path: ['newPassword'],
    message: 'La nueva contraseña debe ser distinta de la actual.',
  });
