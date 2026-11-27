// Ejecuta tests/schema-check.sql contra DATABASE_URL. El archivo termina en ROLLBACK.
import { existsSync, readFileSync } from 'node:fs';
import { Client } from 'pg';

if (existsSync('.env')) process.loadEnvFile();
if (!process.env.DATABASE_URL) throw new Error('Falta DATABASE_URL');

const client = new Client({ connectionString: process.env.DATABASE_URL });
await client.connect();
try {
  // Si una comprobación falla, cerrar la conexión descarta la transacción.
  await client.query(readFileSync('tests/schema-check.sql', 'utf8'));
  console.log('Esquema correcto.');
} finally {
  await client.end();
}
