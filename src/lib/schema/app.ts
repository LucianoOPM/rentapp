import { sql } from 'drizzle-orm';
import {
  check,
  date,
  integer,
  pgEnum,
  pgTable,
  primaryKey,
  serial,
  text,
  timestamp,
  unique,
  uniqueIndex,
  uuid,
} from 'drizzle-orm/pg-core';
import { user } from './auth';

export const leaseStatus = pgEnum('lease_status', ['draft', 'pending_signature', 'signed', 'terminated']);
export const chargeConcept = pgEnum('charge_concept', ['rent', 'deposit', 'power', 'water', 'internet', 'other']);
export const chargeStatus = pgEnum('charge_status', ['pending', 'in_review', 'paid']);
export const paymentStatus = pgEnum('payment_status', ['in_review', 'confirmed', 'rejected']);
export const reportStatus = pgEnum('report_status', ['received', 'in_progress', 'resolved']);

// Funciones: cada tabla necesita sus propios constructores de columna.
const id = () => serial('id').primaryKey();
// Es el identificador que va en URL y formularios, en lugar de `id`.
const publicId = () => uuid('public_id').notNull().unique().defaultRandom();
const instant = (name: string) => timestamp(name, { withTimezone: true });
const createdAt = () => instant('created_at').notNull().defaultNow();

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

export const paymentCharge = pgTable(
  'payment_charge',
  {
    paymentId: integer('payment_id').notNull().references(() => payment.id, { onDelete: 'restrict' }),
    chargeId: integer('charge_id').notNull().references(() => charge.id, { onDelete: 'restrict' }),
    createdAt: createdAt(),
  },
  (t) => [primaryKey({ columns: [t.paymentId, t.chargeId] })],
);

export const maintenanceReport = pgTable('maintenance_report', {
  id: id(),
  publicId: publicId(),
  unitId: integer('unit_id').notNull().references(() => unit.id, { onDelete: 'restrict' }),
  createdBy: integer('created_by').notNull().references(() => user.id, { onDelete: 'restrict' }),
  title: text('title').notNull(),
  description: text('description').notNull(),
  status: reportStatus('status').notNull().default('received'),
  adminNote: text('admin_note'),
  resolvedAt: instant('resolved_at'),
  createdAt: createdAt(),
});

export const reportPhoto = pgTable('report_photo', {
  id: id(),
  reportId: integer('report_id').notNull().references(() => maintenanceReport.id, { onDelete: 'restrict' }),
  fileId: integer('file_id').notNull().references(() => file.id, { onDelete: 'restrict' }),
  createdAt: createdAt(),
});
