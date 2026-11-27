import { eq } from 'drizzle-orm';
import type { db } from '@lib/db';
import { user } from '@lib/schema/user';

export interface UserRepository {
  clearMustChangePassword(userId: number): Promise<void>;
}

export class DrizzleUserRepository implements UserRepository {
  readonly #db: typeof db;

  constructor(database: typeof db) {
    this.#db = database;
  }

  async clearMustChangePassword(userId: number) {
    await this.#db.update(user).set({ mustChangePassword: false }).where(eq(user.id, userId));
  }
}
