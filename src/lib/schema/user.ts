import { relations } from 'drizzle-orm';
import { boolean, pgEnum, pgTable, serial, text, timestamp, uuid } from 'drizzle-orm/pg-core';
// Relativas y con `.ts`: Node carga estas entidades desde `scripts/`, sin alias.
import { account } from './account.ts';
import { session } from './session.ts';

export const roleEnum = pgEnum('user_role', ['admin', 'renter']);

export const user = pgTable('user', {
  id: serial('id').primaryKey(),
  name: text('name').notNull(),
  email: text('email').notNull().unique(),
  emailVerified: boolean('email_verified').default(false).notNull(),
  image: text('image'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true })
    .defaultNow()
    .$onUpdate(() => /* @__PURE__ */ new Date())
    .notNull(),
  username: text('username').unique(),
  displayUsername: text('display_username'),
  role: roleEnum('role').default('renter').notNull(),
  phone: text('phone'),
  mustChangePassword: boolean('must_change_password').default(true).notNull(),
  publicId: uuid('public_id').notNull().unique().defaultRandom(),
});

export const userRelations = relations(user, ({ many }) => ({
  sessions: many(session),
  accounts: many(account),
}));

export type User = typeof user.$inferSelect;
export type NewUser = typeof user.$inferInsert;
export type UserRole = (typeof roleEnum.enumValues)[number];
