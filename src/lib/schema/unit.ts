import { integer, pgTable, text } from 'drizzle-orm/pg-core';
import { createdAt, id, publicId } from '@lib/schema/columns';

export const unit = pgTable('unit', {
  id: id(),
  publicId: publicId(),
  name: text('name').notNull(),
  sortOrder: integer('sort_order').notNull().unique(),
  wifiSsid: text('wifi_ssid'),
  wifiPasswordEnc: text('wifi_password_enc'),
  notes: text('notes'),
  createdAt: createdAt(),
});

export type Unit = typeof unit.$inferSelect;
export type NewUnit = typeof unit.$inferInsert;
