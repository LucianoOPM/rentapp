import { test } from 'node:test';
import assert from 'node:assert/strict';
import { accessRedirect } from '../src/lib/route-access.ts';

const admin = { role: 'admin', mustChangePassword: false };
const renter = { role: 'renter', mustChangePassword: false };
const temporary = { role: 'renter', mustChangePassword: true };

function expect(user, cases) {
  for (const [route, target] of Object.entries(cases)) {
    assert.equal(accessRedirect(route, user), target, route);
  }
}

test('sin sesión, las rutas protegidas llevan a /login', () => {
  expect(null, {
    '/': '/login',
    '/admin': '/login',
    '/admin/departamentos/[publicId]': '/login',
    '/app': '/login',
    '/app/cuenta': '/login',
    '/cambiar-contrasena': '/login',
    '/login': null,
    '/404': null,
  });
});

test('una ruta que solo se parece no es parte del área', () => {
  expect(null, { '/application': null, '/administrar': null });
});

test('la contraseña temporal obliga a cambiarla, sin bucle', () => {
  expect(temporary, {
    '/': '/cambiar-contrasena',
    '/app': '/cambiar-contrasena',
    '/app/cuenta': '/cambiar-contrasena',
    '/admin': '/cambiar-contrasena',
    '/cambiar-contrasena': null,
    '/login': null,
  });
});

test('cada rol entra en su área y desde la otra vuelve a la suya', () => {
  expect(admin, { '/': '/admin', '/admin': null, '/admin/pagos': null, '/app': '/admin', '/cambiar-contrasena': null });
  expect(renter, { '/': '/app', '/app': null, '/app/cuenta': null, '/admin': '/app', '/admin/pagos': '/app' });
});

test('un rol desconocido nunca entra en /admin', () => {
  expect({ role: null, mustChangePassword: false }, { '/admin': '/app' });
});
