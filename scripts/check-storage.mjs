// Comprueba `storage.ts` contra la cuenta real de CLOUDINARY_URL. Sube dos archivos y los borra.
// Uso: node scripts/check-storage.mjs   (o con --env-file=<ruta del .env>)
import { existsSync } from 'node:fs';
import { setTimeout as sleep } from 'node:timers/promises';
import { CloudinaryStorage, parseCloudinaryUrl } from '../src/lib/storage.ts';

if (!process.env.CLOUDINARY_URL && existsSync('.env')) process.loadEnvFile();
if (!process.env.CLOUDINARY_URL) throw new Error('Falta CLOUDINARY_URL');

const config = parseCloudinaryUrl(process.env.CLOUDINARY_URL);
const storage = new CloudinaryStorage(config);
const samples = {
  'application/pdf': Buffer.from(
    '%PDF-1.4\n1 0 obj<</Type/Catalog/Pages 2 0 R>>endobj\n2 0 obj<</Type/Pages/Kids[]/Count 0>>endobj\ntrailer<</Root 1 0 R>>\n%%EOF\n',
  ),
  'image/png': Buffer.from(
    'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhWMjWwAAAABJRU5ErkJggg==',
    'base64',
  ),
};

let failed = false;
function check(label, ok, detail = '') {
  console.log(`${ok ? 'OK   ' : 'FALLA'} ${label}${!ok && detail ? `: ${detail}` : ''}`);
  if (!ok) failed = true;
}

const download = async (key) => Buffer.from(await new Response(await storage.get(key)).arrayBuffer());

for (const [mimeType, bytes] of Object.entries(samples)) {
  let key;
  try {
    ({ key } = await storage.upload(bytes, mimeType));
    check(`${mimeType}: subida`, true);
    check(`${mimeType}: descarga con los mismos bytes`, bytes.equals(await download(key)));
    const unsigned = await fetch(`https://res.cloudinary.com/${config.cloudName}/raw/authenticated/${key}`);
    await unsigned.body?.cancel();
    check(`${mimeType}: sin firma no se puede abrir`, !unsigned.ok, `HTTP ${unsigned.status}`);
  } catch (error) {
    check(`${mimeType}: subida y descarga`, false, error.message);
  } finally {
    if (key) {
      try {
        await storage.remove(key);
        // La CDN sigue sirviendo su copia unos segundos, hasta que se invalida.
        let gone = false;
        for (let attempt = 0; attempt < 12 && !gone; attempt++) {
          if (attempt) await sleep(5000);
          gone = await download(key).then(() => false, () => true);
        }
        check(`${mimeType}: borrado`, gone, 'tras un minuto todavía se puede descargar');
      } catch (error) {
        check(`${mimeType}: borrado de ${key}`, false, error.message);
      }
    }
  }
}

process.exitCode = failed ? 1 : 0;
