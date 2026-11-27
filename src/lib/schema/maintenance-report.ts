import { integer, pgEnum, pgTable, text } from 'drizzle-orm/pg-core';
import { createdAt, id, instant, publicId } from '@lib/schema/columns';
import { unit } from '@lib/schema/unit';
import { user } from '@lib/schema/user';

export const reportStatus = pgEnum('report_status', ['received', 'in_progress', 'resolved']);

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

export type MaintenanceReport = typeof maintenanceReport.$inferSelect;
export type NewMaintenanceReport = typeof maintenanceReport.$inferInsert;
export type ReportStatus = (typeof reportStatus.enumValues)[number];
