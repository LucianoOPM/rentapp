import type { APIRoute } from 'astro';
import { authService } from '@lib/container';

export const ALL: APIRoute = ({ request, clientAddress }) => authService.handle(request, clientAddress);
