import { pgTable, text, timestamp, boolean } from 'drizzle-orm/pg-core';

export const rooms = pgTable('rooms', {
  id: text('id').primaryKey(),
  code: text('code').unique().notNull(),
  status: text('status').notNull().default('waiting'),
  createdAt: timestamp('created_at').defaultNow(),
});

export const players = pgTable('players', {
  id: text('id').primaryKey(),
  roomId: text('room_id').notNull().references(() => rooms.id, { onDelete: 'cascade' }),
  name: text('name').notNull(),
  role: text('role'),
  isCreator: boolean('is_creator').default(false),
  joinedAt: timestamp('joined_at').defaultNow(),
});
