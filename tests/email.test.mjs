import { test } from 'node:test';
import assert from 'node:assert/strict';
import { inspect } from 'node:util';
import { emailConfigFrom, ResendMailer } from '../src/lib/email.ts';

const config = { apiKey: 're_secreta', from: 'avisos@example.test', adminEmail: 'admin@example.test' };
const message = { subject: 'Asunto', text: 'Texto' };

/** Revisa todo lo que un log podría mostrar del error, incluidas sus propiedades y `cause`. */
const failsWithoutLeaking = (expected) => (error) => {
  assert.match(error.message, expected);
  const dump = inspect(error, { depth: 5, showHidden: true });
  for (const secret of Object.values(config)) assert.ok(!dump.includes(secret), `el error contiene "${secret}"`);
  return true;
};

test('sendEmail manda a la administradora la petición que pide Resend', async () => {
  let url, init;
  const mailer = new ResendMailer(config, async (...args) => {
    [url, init] = args;
    return Response.json({ id: '1' });
  });
  await mailer.sendEmail({ ...message, to: 'otro@example.test' });
  assert.equal(url, 'https://api.resend.com/emails');
  assert.equal(init.method, 'POST');
  assert.deepEqual(init.headers, {
    Authorization: 'Bearer re_secreta',
    'Content-Type': 'application/json',
    'User-Agent': 'mailer/1.0',
  });
  assert.deepEqual(JSON.parse(init.body), { from: config.from, to: config.adminEmail, ...message });
  assert.ok(init.signal instanceof AbortSignal);
});

test('sendEmail informa solo el código HTTP cuando Resend rechaza', async () => {
  const mailer = new ResendMailer(config, async () =>
    Response.json({ message: `solo puedes enviar a ${config.adminEmail}` }, { status: 403 }),
  );
  await assert.rejects(mailer.sendEmail(message), failsWithoutLeaking(/^Resend: falló el envío \(HTTP 403\)$/));
});

test('sendEmail no filtra datos si falla la red o se agota el tiempo', async () => {
  const mailer = new ResendMailer(config, async (_url, init) => {
    throw new Error(`${init.headers.Authorization} ${init.body}`);
  });
  await assert.rejects(mailer.sendEmail(message), failsWithoutLeaking(/^Resend: falló el envío$/));
});

test('sendEmail decide por el código HTTP aunque el cuerpo de la respuesta se corte', async () => {
  const broken = (status) => async () =>
    new Response(new ReadableStream({ start: (controller) => controller.error(new Error('conexión cortada')) }), {
      status,
    });
  await new ResendMailer(config, broken(200)).sendEmail(message);
  await assert.rejects(
    new ResendMailer(config, broken(403)).sendEmail(message),
    failsWithoutLeaking(/^Resend: falló el envío \(HTTP 403\)$/),
  );
});

test('sendEmail no llama a Resend sin asunto o sin texto', async () => {
  const mailer = new ResendMailer(config, async () => assert.fail('no debía llamar a fetch'));
  await assert.rejects(mailer.sendEmail({ subject: ' ', text: 'Texto' }), /asunto y texto/);
  await assert.rejects(mailer.sendEmail({ subject: 'Asunto', text: '' }), /asunto y texto/);
});

test('emailConfigFrom lee las tres variables', () => {
  const env = { RESEND_API_KEY: config.apiKey, MAIL_FROM: config.from, ADMIN_EMAIL: config.adminEmail };
  assert.deepEqual(emailConfigFrom(env), config);
});

test('el constructor y emailConfigFrom nombran lo que falta sin repetir valores', () => {
  assert.throws(
    () => emailConfigFrom({ RESEND_API_KEY: config.apiKey, MAIL_FROM: '  ' }),
    failsWithoutLeaking(/Faltan variables de correo: MAIL_FROM, ADMIN_EMAIL$/),
  );
  assert.throws(
    () => new ResendMailer({ ...config, apiKey: '' }),
    failsWithoutLeaking(/Faltan variables de correo: RESEND_API_KEY$/),
  );
});
