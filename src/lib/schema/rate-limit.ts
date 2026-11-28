import { bigint, integer, pgTable, text } from 'drizzle-orm/pg-core';
import { id } from '@lib/schema/columns';

// La usa Better Auth para el límite de intentos; busca las propiedades por estos nombres.
export const rateLimit = pgTable('rate_limit', {
  id: id(),
  key: text('key').notNull().unique(),
  count: integer('count').notNull(),
  lastRequest: bigint('last_request', { mode: 'number' }).notNull(),
});

export type RateLimit = typeof rateLimit.$inferSelect;
export type NewRateLimit = typeof rateLimit.$inferInsert;
