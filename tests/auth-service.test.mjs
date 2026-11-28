import { test } from 'node:test';
import assert from 'node:assert/strict';
import { AuthService, LoginError } from '../src/lib/services/auth-service.ts';

const withCookie = () => new Headers({ 'set-cookie': 'sesion=abc; Path=/; HttpOnly' });

const form = () =>
  new Request('http://localhost:4321/_actions/login', {
    method: 'POST',
    headers: {
      'x-client-ip': '1.1.1.1',
      origin: 'http://localhost:4321',
      'content-type': 'application/x-www-form-urlencoded',
      'content-length': '999',
    },
  });

const signedIn = async () => new Response('{}', { headers: withCookie() });
const credentials = { username: 'prueba', password: 'temporal-1' };

function setup(api, handler) {
  const cleared = [];
  const users = { clearMustChangePassword: async (id) => void cleared.push(id) };
  return { service: new AuthService({ api, handler }, users), cleared };
}

test('login lee la sesión nueva con la cookie recién creada', async () => {
  let sent;
  const { service } = setup(
    {
      getSession: async ({ headers }) => {
        sent = headers.get('cookie');
        return { user: { mustChangePassword: true } };
      },
    },
    signedIn,
  );
  const result = await service.login(credentials, form(), '203.0.113.7');
  assert.equal(sent, 'sesion=abc');
  assert.equal(result.mustChangePassword, true);
  assert.deepEqual(result.headers.getSetCookie(), withCookie().getSetCookie());
});

test('login falla si la sesión nueva no se puede leer', async () => {
  const { service } = setup({ getSession: async () => null }, signedIn);
  await assert.rejects(service.login(credentials, form(), '203.0.113.7'), /no se pudo leer/);
});

test('login pide el acceso al handler y reemplaza la IP que mande el cliente', async () => {
  let sent;
  const { service } = setup({ getSession: async () => ({ user: { mustChangePassword: false } }) }, async (request) => {
    sent = request;
    return signedIn();
  });
  await service.login(credentials, form(), '203.0.113.7');
  assert.equal(sent.method, 'POST');
  assert.equal(sent.url, 'http://localhost:4321/api/auth/sign-in/username');
  assert.equal(sent.headers.get('x-client-ip'), '203.0.113.7');
  assert.equal(sent.headers.get('origin'), 'http://localhost:4321');
  assert.equal(sent.headers.get('content-type'), 'application/json');
  assert.equal(sent.headers.get('content-length'), null);
  assert.deepEqual(await sent.json(), credentials);
});

for (const status of [401, 429, 500]) {
  test(`login falla con LoginError ${status}`, async () => {
    const { service } = setup({}, async () => new Response('{}', { status }));
    await assert.rejects(
      service.login(credentials, form(), '203.0.113.7'),
      (error) => error instanceof LoginError && error.status === status,
    );
  });
}

test('handle reemplaza la IP en las peticiones HTTP de Better Auth y conserva el cuerpo', async () => {
  let sent;
  const { service } = setup({}, async (request) => {
    sent = request;
    return new Response();
  });
  const original = new Request('http://localhost:4321/api/auth/sign-in/username', {
    method: 'POST',
    headers: { 'x-client-ip': '1.1.1.1' },
    body: '{"username":"prueba"}',
  });
  await service.handle(original, '203.0.113.7');
  assert.equal(sent.headers.get('x-client-ip'), '203.0.113.7');
  assert.equal(await sent.text(), '{"username":"prueba"}');
});

test('cambiar la contraseña quita la marca y cierra las otras sesiones', async () => {
  let body;
  const { service, cleared } = setup({
    changePassword: async (options) => {
      body = options.body;
      return { headers: withCookie(), response: { user: { id: '7' } } };
    },
  });
  await service.changeOwnPassword(new Headers(), 'temporal-1', 'nueva-clave');
  assert.deepEqual(cleared, [7]);
  assert.equal(body.revokeOtherSessions, true);
});

test('si el cambio falla, la marca sigue activa', async () => {
  const { service, cleared } = setup({
    changePassword: async () => {
      throw new Error('contraseña incorrecta');
    },
  });
  await assert.rejects(service.changeOwnPassword(new Headers(), 'mala', 'nueva-clave'), /contraseña incorrecta/);
  assert.deepEqual(cleared, []);
});
