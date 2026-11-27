import type { APIRoute } from 'astro';
import { authService } from '@lib/container';

export const ALL: APIRoute = ({ request }) => authService.handle(request);
