// Envía un correo real de prueba a ADMIN_EMAIL con la cuenta de RESEND_API_KEY.
// Uso: node scripts/check-email.mjs   (o con --env-file=<ruta del .env>)
import { existsSync } from 'node:fs';
import { emailConfigFrom, ResendMailer } from '../src/lib/email.ts';

if (!process.env.RESEND_API_KEY && existsSync('.env')) process.loadEnvFile();

try {
  const mailer = new ResendMailer(emailConfigFrom(process.env));
  await mailer.sendEmail({
    subject: 'Prueba de avisos',
    text: 'Si ves este mensaje, la plataforma de rentas ya puede enviarte avisos.',
  });
  console.log('OK    Resend aceptó el correo. Falta confirmar que llegó (revisa también spam).');
} catch (error) {
  console.log(`FALLA ${error.message}`);
  if (error.message.includes('403')) {
    console.log('Revisa la API key. Con onboarding@resend.dev, ADMIN_EMAIL debe ser el correo de la cuenta de Resend.');
  }
  process.exitCode = 1;
}
