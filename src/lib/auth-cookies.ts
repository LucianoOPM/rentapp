import type { AstroCookies } from 'astro';
import { parseSetCookieHeader, toCookieOptions } from 'better-auth/cookies';

/** Pasa a Astro las cookies que Better Auth puso en sus headers de respuesta. */
export function applyAuthCookies(headers: Headers, cookies: AstroCookies) {
  for (const header of headers.getSetCookie()) {
    for (const [name, attributes] of parseSetCookieHeader(header)) {
      cookies.set(name, attributes.value, toCookieOptions(attributes));
    }
  }
}
