import { integer, pgTable } from 'drizzle-orm/pg-core';
import { createdAt, id } from '@lib/schema/columns';
import { file } from '@lib/schema/file';
import { maintenanceReport } from '@lib/schema/maintenance-report';

export const reportPhoto = pgTable('report_photo', {
  id: id(),
  reportId: integer('report_id').notNull().references(() => maintenanceReport.id, { onDelete: 'restrict' }),
  fileId: integer('file_id').notNull().references(() => file.id, { onDelete: 'restrict' }),
  createdAt: createdAt(),
});

export type ReportPhoto = typeof reportPhoto.$inferSelect;
export type NewReportPhoto = typeof reportPhoto.$inferInsert;
