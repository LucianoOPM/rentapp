import { integer, pgTable, text, unique } from 'drizzle-orm/pg-core';
import { createdAt, id, publicId } from '@lib/schema/columns';

export const file = pgTable(
  'file',
  {
    id: id(),
    publicId: publicId(),
    provider: text('provider').notNull(),
    key: text('key').notNull(),
    mimeType: text('mime_type').notNull(),
    sizeBytes: integer('size_bytes').notNull(),
    createdAt: createdAt(),
  },
  (t) => [unique('file_provider_key_unique').on(t.provider, t.key)],
);

export type File = typeof file.$inferSelect;
export type NewFile = typeof file.$inferInsert;
