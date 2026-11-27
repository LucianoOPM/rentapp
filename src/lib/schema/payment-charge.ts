import { integer, pgTable, primaryKey } from 'drizzle-orm/pg-core';
import { charge } from '@lib/schema/charge';
import { createdAt } from '@lib/schema/columns';
import { payment } from '@lib/schema/payment';

export const paymentCharge = pgTable(
  'payment_charge',
  {
    paymentId: integer('payment_id').notNull().references(() => payment.id, { onDelete: 'restrict' }),
    chargeId: integer('charge_id').notNull().references(() => charge.id, { onDelete: 'restrict' }),
    createdAt: createdAt(),
  },
  (t) => [primaryKey({ columns: [t.paymentId, t.chargeId] })],
);

export type PaymentCharge = typeof paymentCharge.$inferSelect;
export type NewPaymentCharge = typeof paymentCharge.$inferInsert;
