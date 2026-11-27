import { sql } from 'drizzle-orm';
import { check, integer, pgEnum, pgTable, text } from 'drizzle-orm/pg-core';
import { createdAt, id, instant, publicId } from '@lib/schema/columns';
import { file } from '@lib/schema/file';
import { lease } from '@lib/schema/lease';
import { user } from '@lib/schema/user';

export const paymentStatus = pgEnum('payment_status', ['in_review', 'confirmed', 'rejected']);

export const payment = pgTable(
  'payment',
  {
    id: id(),
    publicId: publicId(),
    leaseId: integer('lease_id').notNull().references(() => lease.id, { onDelete: 'restrict' }),
    amountCents: integer('amount_cents').notNull(),
    proofFileId: integer('proof_file_id').notNull().references(() => file.id, { onDelete: 'restrict' }),
    status: paymentStatus('status').notNull().default('in_review'),
    reviewedBy: integer('reviewed_by').references(() => user.id, { onDelete: 'restrict' }),
    reviewedAt: instant('reviewed_at'),
    note: text('note'),
    createdAt: createdAt(),
  },
  (t) => [check('payment_amount_cents_check', sql`${t.amountCents} >= 0`)],
);

export type Payment = typeof payment.$inferSelect;
export type NewPayment = typeof payment.$inferInsert;
export type PaymentStatus = (typeof paymentStatus.enumValues)[number];
