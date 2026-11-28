import { mock, test } from 'node:test';
import assert from 'node:assert/strict';
import { fileResponse } from '../src/lib/file-response.ts';

const publicId = '3f2b8c1e-9a4d-4e6f-8b2a-1c5d7e9f0a3b';
const record = { id: 1, publicId, key: 'k.pdf', mimeType: 'application/pdf' };
const user = { id: '1', role: 'admin' };
const extension = () => 'pdf';

function files(overrides = {}) {
  let lookups = 0;
  return {
    findAccessible: async () => (lookups++, record),
    open: async () => new Response('%PDF').body,
    lookups: () => lookups,
    ...overrides,
  };
}

test('sin sesión responde 401 y con contraseña temporal 403, sin buscar el archivo', async () => {
  const service = files();
  assert.equal((await fileResponse(service, null, publicId, extension)).status, 401);
  const temporary = { ...user, mustChangePassword: true };
  assert.equal((await fileResponse(service, temporary, publicId, extension)).status, 403);
  assert.equal(service.lookups(), 0);
});

test('sin archivo accesible responde 404', async () => {
  const service = files({ findAccessible: async () => null });
  assert.equal((await fileResponse(service, user, publicId, extension)).status, 404);
});

test('si falla el proveedor responde 502 sin detalles', async () => {
  const log = mock.method(console, 'error', () => {});
  const service = files({
    open: async () => {
      throw new Error('detalle interno');
    },
  });
  const response = await fileResponse(service, user, publicId, extension);
  assert.equal(response.status, 502);
  assert.ok(!(await response.text()).includes('detalle interno'));
  assert.equal(log.mock.callCount(), 1);
  log.mock.restore();
});

test('permitido: reenvía el contenido con sus headers', async () => {
  const response = await fileResponse(files(), user, publicId, extension);
  assert.equal(response.status, 200);
  assert.equal(await response.text(), '%PDF');
  assert.equal(response.headers.get('content-type'), 'application/pdf');
  assert.equal(response.headers.get('content-disposition'), `inline; filename="${publicId}.pdf"`);
  assert.equal(response.headers.get('cache-control'), 'private, no-store');
  assert.equal(response.headers.get('x-content-type-options'), 'nosniff');
});
