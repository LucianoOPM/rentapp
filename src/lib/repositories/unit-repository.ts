import { asc } from 'drizzle-orm';
import type { db } from '@lib/db';
import { unit, type Unit } from '@lib/schema/unit';

export interface UnitRepository {
  findAll(): Promise<Pick<Unit, 'name'>[]>;
}

export class DrizzleUnitRepository implements UnitRepository {
  readonly #db: typeof db;

  constructor(database: typeof db) {
    this.#db = database;
  }

  findAll() {
    return this.#db.select({ name: unit.name }).from(unit).orderBy(asc(unit.sortOrder));
  }
}
