import { test } from 'node:test';
import assert from 'node:assert/strict';
import { FileService } from '../src/lib/services/file-service.ts';
import { LeaseService } from '../src/lib/services/lease-service.ts';

const publicId = '3f2b8c1e-9a4d-4e6f-8b2a-1c5d7e9f0a3b';
const record = { id: 1, publicId, key: 'k.pdf', mimeType: 'application/pdf' };
const admin = { id: '1', role: 'admin' };
// Better Auth entrega el id como texto.
const renter = { id: '7', role: 'renter' };

const signed = { id: 10, unitId: 2, status: 'signed' };
const pending = { ...signed, status: 'pending_signature' };

function setup({ references = [], active = [] } = {}) {
  const queried = [];
  const files = {
    findByPublicId: async (value) => (queried.push(value), record),
    findReferences: async () => references,
  };
  const leases = new LeaseService({ findActiveByRenter: async (id) => (id === 7 ? active : []) });
  const service = new FileService(files, leases, { get: async (key) => `flujo de ${key}` });
  return { service, queried };
}

const allowed = async (options, user = renter) =>
  (await setup(options).service.findAccessible(user, publicId)) !== null;

test('la administradora abre un archivo sin referencias y un inquilino no', async () => {
  assert.equal(await allowed({}, admin), true);
  assert.equal(await allowed({}), false);
});

test('contrato propio: por firmar, firmado y terminado sí; borrador y ajeno no', async () => {
  const lease = (status, renterId = 7) => ({ references: [{ kind: 'lease', renterId, status }] });
  for (const status of ['pending_signature', 'signed', 'terminated']) {
    assert.equal(await allowed(lease(status)), true, status);
    assert.equal(await allowed(lease(status, 8)), false, `ajeno ${status}`);
  }
  assert.equal(await allowed(lease('draft')), false);
});

for (const kind of ['charge', 'payment']) {
  test(`${kind}: solo con el contrato activo firmado y del mismo contrato`, async () => {
    const references = [{ kind, leaseId: 10 }];
    assert.equal(await allowed({ references, active: [signed] }), true);
    assert.equal(await allowed({ references, active: [pending] }), false);
    assert.equal(await allowed({ references, active: [] }), false);
    assert.equal(await allowed({ references: [{ kind, leaseId: 11 }], active: [signed] }), false);
  });
}

test('recibo compartido: basta una referencia propia', async () => {
  const references = [{ kind: 'charge', leaseId: 11 }, { kind: 'charge', leaseId: 10 }];
  assert.equal(await allowed({ references, active: [signed] }), true);
});

test('foto: exige contrato firmado, su departamento y haberla creado', async () => {
  const photo = (unitId, createdBy) => [{ kind: 'photo', unitId, createdBy }];
  assert.equal(await allowed({ references: photo(2, 7), active: [signed] }), true);
  assert.equal(await allowed({ references: photo(2, 8), active: [signed] }), false, 'inquilino anterior');
  assert.equal(await allowed({ references: photo(3, 7), active: [signed] }), false, 'otro departamento');
  assert.equal(await allowed({ references: photo(2, 7), active: [pending] }), false, 'por firmar');
});

test('con dos contratos activos no se entrega nada, ni un contrato propio', async () => {
  const { service } = setup({
    references: [{ kind: 'lease', renterId: 7, status: 'signed' }],
    active: [signed, { ...signed, id: 11, unitId: 3 }],
  });
  await assert.rejects(service.findAccessible(renter, publicId), /más de un contrato activo/);
});

test('un rol distinto de admin se trata como inquilino', async () => {
  assert.equal(await allowed({}, { id: '1', role: null }), false);
});

test('un publicId que no es UUID no consulta la base; uno en mayúsculas sí', async () => {
  const { service, queried } = setup();
  for (const value of ['', 'abc', `${publicId}x`, '1 OR 1=1']) {
    assert.equal(await service.findAccessible(admin, value), null);
  }
  assert.equal(queried.length, 0);
  assert.notEqual(await service.findAccessible(admin, publicId.toUpperCase()), null);
});

test('open pide el contenido por la key', async () => {
  assert.equal(await setup().service.open(record), 'flujo de k.pdf');
});
