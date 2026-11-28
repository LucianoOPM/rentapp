import type { APIRoute } from 'astro';
import { fileService } from '@lib/container';
import { fileResponse } from '@lib/file-response';
import { extensionFor } from '@lib/storage';

export const GET: APIRoute = ({ locals, params }) =>
  fileResponse(fileService, locals.user, params.publicId ?? '', extensionFor);
