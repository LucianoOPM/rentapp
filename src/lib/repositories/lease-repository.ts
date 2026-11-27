import { and, eq, inArray } from 'drizzle-orm';
import type { db } from '@lib/db';
import { lease, type LeaseStatus } from '@lib/schema/lease';

export type ActiveLease = { id: number; unitId: number; status: LeaseStatus };

export interface LeaseRepository {
  /** Contratos por firmar o firmados del inquilino. */
  findActiveByRenter(renterId: number): Promise<ActiveLease[]>;
}

export class DrizzleLeaseRepository implements LeaseRepository {
  readonly #db: typeof db;

  constructor(database: typeof db) {
    this.#db = database;
  }

  findActiveByRenter(renterId: number) {
    return this.#db
      .select({ id: lease.id, unitId: lease.unitId, status: lease.status })
      .from(lease)
      .where(and(eq(lease.renterId, renterId), inArray(lease.status, ['pending_signature', 'signed'])));
  }
}
