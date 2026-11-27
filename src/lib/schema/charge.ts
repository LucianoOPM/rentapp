import { sql } from 'drizzle-orm';
import { check, date, integer, pgEnum, pgTable, text } from 'drizzle-orm/pg-core';
import { createdAt, id, publicId } from '@lib/schema/columns';
import { file } from '@lib/schema/file';
import { lease } from '@lib/schema/lease';

export const chargeConcept = pgEnum('charge_concept', ['rent', 'deposit', 'power', 'water', 'internet', 'other']);
export const chargeStatus = pgEnum('charge_status', ['pending', 'in_review', 'paid']);

export const charge = pgTable(
  'charge',
  {
    id: id(),
    publicId: publicId(),
    leaseId: integer('lease_id').notNull().references(() => lease.id, { onDelete: 'restrict' }),
    period: text('period').notNull(),
    concept: chargeConcept('concept').notNull(),
    amountCents: integer('amount_cents').notNull(),
    dueDate: date('due_date').notNull(),
    receiptFileId: integer('receipt_file_id').references(() => file.id, { onDelete: 'restrict' }),
    status: chargeStatus('status').notNull().default('pending'),
    createdAt: createdAt(),
  },
  (t) => [
    check('charge_amount_cents_check', sql`${t.amountCents} >= 0`),
    check('charge_period_check', sql`${t.period} ~ '^[0-9]{4}-(0[1-9]|1[0-2])$'`),
  ],
);

export type Charge = typeof charge.$inferSelect;
export type NewCharge = typeof charge.$inferInsert;
export type ChargeConcept = (typeof chargeConcept.enumValues)[number];
export type ChargeStatus = (typeof chargeStatus.enumValues)[number];
