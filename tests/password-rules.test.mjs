import { test } from 'node:test';
import assert from 'node:assert/strict';
import { changePasswordInput } from '../src/lib/password-rules.ts';

const ok = { currentPassword: 'temporal-1', newPassword: 'nueva-clave', confirmPassword: 'nueva-clave' };
const errorsOf = (patch) => changePasswordInput.safeParse({ ...ok, ...patch }).error?.issues.map((i) => i.message) ?? [];

test('acepta un cambio válido', () => assert.deepEqual(errorsOf({}), []));
test('rechaza menos de 8 caracteres', () =>
  assert.ok(errorsOf({ newPassword: 'corta', confirmPassword: 'corta' }).includes('La nueva contraseña debe tener al menos 8 caracteres.')));
test('rechaza una confirmación distinta', () =>
  assert.ok(errorsOf({ confirmPassword: 'otra-clave' }).includes('Las contraseñas no coinciden.')));
test('rechaza repetir la actual', () =>
  assert.ok(errorsOf({ newPassword: 'temporal-1', confirmPassword: 'temporal-1' }).includes('La nueva contraseña debe ser distinta de la actual.')));
test('pide los campos vacíos en español', () =>
  assert.ok(errorsOf({ currentPassword: null }).includes('Escribe tu contraseña actual.')));
