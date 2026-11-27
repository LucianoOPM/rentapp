// Único archivo que habla con Cloudinary (decisión 015). Lo cargan `node --test` y `scripts/`.
// La URL firmada no vence: no sale de aquí, tampoco en errores ni logs.
import { randomUUID } from 'node:crypto';
import cloudinaryPackage from 'cloudinary';

const { v2: cloudinary } = cloudinaryPackage;

// `raw` conserva los bytes originales.
const asset = { resource_type: 'raw', type: 'authenticated' } as const;

const extensions: Record<string, string> = {
  'application/pdf': 'pdf',
  'image/jpeg': 'jpg',
  'image/png': 'png',
  'image/webp': 'webp',
};

export const extensionFor = (mimeType: string): string | undefined =>
  Object.hasOwn(extensions, mimeType) ? extensions[mimeType] : undefined;

export type StorageConfig = { cloudName: string; apiKey: string; apiSecret: string };

export function parseCloudinaryUrl(url: string): StorageConfig {
  // El error de `new URL` guarda la entrada, que contiene el secreto: no se propaga.
  const parsed = URL.canParse(url) ? new URL(url) : null;
  if (parsed?.protocol !== 'cloudinary:' || !parsed.hostname || !parsed.username || !parsed.password) {
    throw new Error('CLOUDINARY_URL debe tener el formato cloudinary://<api_key>:<api_secret>@<cloud_name>');
  }
  return { cloudName: parsed.hostname, apiKey: parsed.username, apiSecret: parsed.password };
}

// Los errores del SDK pueden traer los datos de la petición: solo se conserva el código HTTP.
const providerError = (action: string, status?: unknown) =>
  new Error(`Cloudinary: falló ${action}${typeof status === 'number' ? ` (HTTP ${status})` : ''}`);

export class CloudinaryStorage {
  readonly #credentials: { cloud_name: string; api_key: string; api_secret: string };
  readonly #fetch: typeof fetch;

  constructor(config: StorageConfig, fetchFn: typeof fetch = fetch) {
    this.#credentials = { cloud_name: config.cloudName, api_key: config.apiKey, api_secret: config.apiSecret };
    this.#fetch = fetchFn;
  }

  async upload(bytes: Uint8Array, mimeType: string) {
    const extension = extensionFor(mimeType);
    if (!extension) throw new Error(`Tipo de archivo no admitido: ${mimeType}`);
    if (bytes.byteLength === 0) throw new Error('El archivo está vacío');
    // En `raw`, la extensión es parte del identificador.
    const key = `plataforma-renta/${randomUUID()}.${extension}`;
    await new Promise<void>((resolve, reject) => {
      cloudinary.uploader
        .upload_stream({ ...this.#credentials, ...asset, public_id: key, overwrite: false }, (error) =>
          error ? reject(providerError('la subida', error.http_code)) : resolve(),
        )
        .end(bytes);
    });
    return { provider: 'cloudinary' as const, key };
  }

  async get(key: string): Promise<ReadableStream<Uint8Array>> {
    const url = cloudinary.utils.url(key, { ...this.#credentials, ...asset, sign_url: true, secure: true });
    let response: Response;
    try {
      response = await this.#fetch(url);
    } catch {
      throw providerError('la descarga');
    }
    if (!response.ok || !response.body) {
      await response.body?.cancel();
      throw providerError('la descarga', response.status);
    }
    return response.body;
  }

  async remove(key: string) {
    let result: unknown;
    try {
      ({ result } = await cloudinary.uploader.destroy(key, { ...this.#credentials, ...asset, invalidate: true }));
    } catch (error) {
      throw providerError('el borrado', (error as { http_code?: unknown }).http_code);
    }
    if (result !== 'ok' && result !== 'not found') throw providerError('el borrado');
  }
}
