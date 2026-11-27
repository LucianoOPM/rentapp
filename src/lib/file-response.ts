// Traduce la descarga de un archivo a HTTP. Solo `import type`: se prueba con `node --test`.
import type { FileService } from '@lib/services/file-service';
import type { Viewer } from '@lib/services/lease-service';
import type { extensionFor } from '@lib/storage';

export async function fileResponse(
  files: Pick<FileService, 'findAccessible' | 'open'>,
  user: (Viewer & { mustChangePassword?: boolean | null }) | null,
  publicId: string,
  extensionOf: typeof extensionFor,
): Promise<Response> {
  if (!user) return new Response('Inicia sesión para ver el archivo.', { status: 401 });
  // El middleware no cubre esta ruta.
  if (user.mustChangePassword) return new Response('Cambia tu contraseña para ver el archivo.', { status: 403 });

  const file = await files.findAccessible(user, publicId);
  if (!file) return new Response('No encontramos el archivo.', { status: 404 });

  let body: ReadableStream<Uint8Array>;
  try {
    body = await files.open(file);
  } catch (error) {
    // `storage.ts` entrega errores sin la URL firmada.
    console.error(`No se pudo descargar el archivo ${file.publicId}:`, error instanceof Error ? error.message : error);
    return new Response('No pudimos descargar el archivo. Inténtalo de nuevo.', { status: 502 });
  }
  return new Response(body, {
    headers: {
      'content-type': file.mimeType,
      'content-disposition': `inline; filename="${file.publicId}.${extensionOf(file.mimeType) ?? 'bin'}"`,
      'cache-control': 'private, no-store',
      'x-content-type-options': 'nosniff',
    },
  });
}
