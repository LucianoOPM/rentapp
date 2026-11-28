// Columnas comunes. Son funciones: cada tabla necesita sus propios constructores.
import { serial, timestamp, uuid } from 'drizzle-orm/pg-core';

export const id = () => serial('id').primaryKey();
// Es el identificador que va en URL y formularios, en lugar de `id`.
export const publicId = () => uuid('public_id').notNull().unique().defaultRandom();
export const instant = (name: string) => timestamp(name, { withTimezone: true });
export const createdAt = () => instant('created_at').notNull().defaultNow();
