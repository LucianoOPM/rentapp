import { test } from 'node:test';
import assert from 'node:assert/strict';
import { inspect } from 'node:util';
import { CloudinaryStorage, parseCloudinaryUrl } from '../src/lib/storage.ts';

const config = { cloudName: 'demo', apiKey: '1', apiSecret: 'secreto' };
const key = 'plataforma-renta/abc.pdf';

/** Todo lo que un log podría mostrar del error, incluidas sus propiedades y `cause`. */
const noLeak = (...secrets) => (error) => {
  const dump = inspect(error, { depth: 5, showHidden: true });
  for (const secret of secrets) assert.ok(!dump.includes(secret), `el error contiene "${secret}"`);
  return true;
};

test('get pide una URL firmada y devuelve el contenido', async () => {
  let requested;
  const storage = new CloudinaryStorage(config, async (url) => {
    requested = String(url);
    return new Response('contenido');
  });
  const body = await storage.get(key);
  assert.equal(await new Response(body).text(), 'contenido');
  assert.match(requested, /^https:\/\/res\.cloudinary\.com\/demo\/raw\/authenticated\/s--[\w-]{8}--\//);
  assert.ok(requested.split('?')[0].endsWith(key));
});

test('get no filtra la URL si Cloudinary responde 401', async () => {
  const storage = new CloudinaryStorage(config, async () => new Response('no', { status: 401 }));
  await assert.rejects(storage.get(key), noLeak('cloudinary.com', 's--'));
});

test('get no filtra la URL si falla la red', async () => {
  const storage = new CloudinaryStorage(config, async (url) => {
    throw new Error(String(url));
  });
  await assert.rejects(storage.get(key), noLeak('cloudinary.com', 's--'));
});

test('upload rechaza un tipo no admitido', async () => {
  const storage = new CloudinaryStorage(config);
  await assert.rejects(storage.upload(new Uint8Array([1]), 'image/heic'), /no admitido/);
});

test('upload rechaza un archivo vacío', async () => {
  const storage = new CloudinaryStorage(config);
  await assert.rejects(storage.upload(new Uint8Array(), 'application/pdf'), /vacío/);
});

test('parseCloudinaryUrl separa las credenciales y respeta mayúsculas', () => {
  assert.deepEqual(parseCloudinaryUrl('cloudinary://1:secreto@Demo'), {
    cloudName: 'Demo',
    apiKey: '1',
    apiSecret: 'secreto',
  });
});

test('parseCloudinaryUrl rechaza valores inválidos sin repetirlos', () => {
  for (const value of ['https://1:secreto@demo', 'cloudinary://secreto@demo', 'cloudinary://1:secreto@', 'secreto']) {
    assert.throws(() => parseCloudinaryUrl(value), noLeak('secreto'), value);
  }
});
