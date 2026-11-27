import { test } from 'node:test';
import assert from 'node:assert/strict';
import { AuthService } from '../src/lib/services/auth-service.ts';

const withCookie = () => new Headers({ 'set-cookie': 'sesion=abc; Path=/; HttpOnly' });

function setup(api) {
  const cleared = [];
  const users = { clearMustChangePassword: async (id) => void cleared.push(id) };
  return { service: new AuthService({ api }, users), cleared };
}

test('login lee la sesión nueva con la cookie recién creada', async () => {
  let sent;
  const { service } = setup({
    signInUsername: async () => ({ headers: withCookie() }),
    getSession: async ({ headers }) => {
      sent = headers.get('cookie');
      return { user: { mustChangePassword: true } };
    },
  });
  const result = await service.login({ username: 'prueba', password: 'temporal-1' }, new Headers());
  assert.equal(sent, 'sesion=abc');
  assert.equal(result.mustChangePassword, true);
  assert.deepEqual(result.headers.getSetCookie(), withCookie().getSetCookie());
});

test('login falla si la sesión nueva no se puede leer', async () => {
  const { service } = setup({
    signInUsername: async () => ({ headers: withCookie() }),
    getSession: async () => null,
  });
  await assert.rejects(service.login({ username: 'prueba', password: 'temporal-1' }, new Headers()));
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
