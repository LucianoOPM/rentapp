import { sql } from 'drizzle-orm';
import { check, date, integer, pgEnum, pgTable, text, uniqueIndex } from 'drizzle-orm/pg-core';
import { createdAt, id, instant, publicId } from '@lib/schema/columns';
import { file } from '@lib/schema/file';
import { unit } from '@lib/schema/unit';
import { user } from '@lib/schema/user';

export const leaseStatus = pgEnum('lease_status', ['draft', 'pending_signature', 'signed', 'terminated']);

export const lease = pgTable(
  'lease',
  {
    id: id(),
    publicId: publicId(),
    unitId: integer('unit_id').notNull().references(() => unit.id, { onDelete: 'restrict' }),
    renterId: integer('renter_id').notNull().references(() => user.id, { onDelete: 'restrict' }),
    startDate: date('start_date').notNull(),
    endDate: date('end_date').notNull(),
    rentCents: integer('rent_cents').notNull(),
    depositCents: integer('deposit_cents').notNull(),
    status: leaseStatus('status').notNull().default('draft'),
    originalFileId: integer('original_file_id').references(() => file.id, { onDelete: 'restrict' }),
    signedFileId: integer('signed_file_id').references(() => file.id, { onDelete: 'restrict' }),
    originalSha256: text('original_sha256'),
    signedAt: instant('signed_at'),
    signerIp: text('signer_ip'),
    signerUserAgent: text('signer_user_agent'),
    createdAt: createdAt(),
  },
  (t) => [
    uniqueIndex('lease_one_active_per_unit')
      .on(t.unitId)
      .where(sql`${t.status} IN ('pending_signature', 'signed')`),
    check('lease_rent_cents_check', sql`${t.rentCents} >= 0`),
    check('lease_deposit_cents_check', sql`${t.depositCents} >= 0`),
    check('lease_dates_check', sql`${t.endDate} >= ${t.startDate}`),
  ],
);

export type Lease = typeof lease.$inferSelect;
export type NewLease = typeof lease.$inferInsert;
export type LeaseStatus = (typeof leaseStatus.enumValues)[number];
