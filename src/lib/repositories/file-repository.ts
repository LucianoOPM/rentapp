import { eq, or } from 'drizzle-orm';
import type { db } from '@lib/db';
import { charge } from '@lib/schema/charge';
import { file } from '@lib/schema/file';
import { lease, type LeaseStatus } from '@lib/schema/lease';
import { maintenanceReport } from '@lib/schema/maintenance-report';
import { payment } from '@lib/schema/payment';
import { reportPhoto } from '@lib/schema/report-photo';

export type FileRecord = { id: number; publicId: string; key: string; mimeType: string };

/** Un registro que apunta al archivo; de él salen sus permisos. */
export type FileReference =
  | { kind: 'lease'; renterId: number; status: LeaseStatus }
  | { kind: 'charge' | 'payment'; leaseId: number }
  | { kind: 'photo'; unitId: number; createdBy: number };

export interface FileRepository {
  findByPublicId(publicId: string): Promise<FileRecord | null>;
  findReferences(fileId: number): Promise<FileReference[]>;
}

export class DrizzleFileRepository implements FileRepository {
  readonly #db: typeof db;

  constructor(database: typeof db) {
    this.#db = database;
  }

  async findByPublicId(publicId: string) {
    const [row] = await this.#db
      .select({ id: file.id, publicId: file.publicId, key: file.key, mimeType: file.mimeType })
      .from(file)
      .where(eq(file.publicId, publicId));
    return row ?? null;
  }

  // Una columna nueva que apunte a `file` necesita su consulta aquí; si falta, el inquilino no accede.
  async findReferences(fileId: number): Promise<FileReference[]> {
    const [leases, charges, payments, photos] = await Promise.all([
      this.#db
        .select({ renterId: lease.renterId, status: lease.status })
        .from(lease)
        .where(or(eq(lease.originalFileId, fileId), eq(lease.signedFileId, fileId))),
      this.#db.select({ leaseId: charge.leaseId }).from(charge).where(eq(charge.receiptFileId, fileId)),
      this.#db.select({ leaseId: payment.leaseId }).from(payment).where(eq(payment.proofFileId, fileId)),
      this.#db
        .select({ unitId: maintenanceReport.unitId, createdBy: maintenanceReport.createdBy })
        .from(reportPhoto)
        .innerJoin(maintenanceReport, eq(reportPhoto.reportId, maintenanceReport.id))
        .where(eq(reportPhoto.fileId, fileId)),
    ]);
    return [
      ...leases.map((row) => ({ kind: 'lease' as const, ...row })),
      ...charges.map((row) => ({ kind: 'charge' as const, ...row })),
      ...payments.map((row) => ({ kind: 'payment' as const, ...row })),
      ...photos.map((row) => ({ kind: 'photo' as const, ...row })),
    ];
  }
}
