import { pgTable, text, timestamp, boolean, integer, serial } from 'drizzle-orm/pg-core';

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

export const cards = pgTable('cards', {
  id: integer('id').primaryKey(),
  name: text('name').notNull(),
  nameAnchor: text('name_anchor').notNull().unique(),
  uri: text('uri').notNull(),
  cost: text('cost').default(''),
  cmc: integer('cmc').default(0),
  color: text('color').notNull(),
  type: text('type').notNull(),
  supertype: text('supertype'),
  subtype: text('subtype'),
  rarity: text('rarity').notNull(),
  text: text('text').notNull(),
  flavor: text('flavor').default(''),
  artist: text('artist').notNull(),
  setCode: text('set_code').notNull().default('TRD-2025'),
});

export const rulings = pgTable('rulings', {
  id: serial('id').primaryKey(),
  cardId: integer('card_id').notNull().references(() => cards.id, { onDelete: 'cascade' }),
  text: text('text').notNull(),
});
