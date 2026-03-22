import postgres from 'postgres';

const DATABASE_URL = process.env.DATABASE_URL || 'postgres://postgres:secret@localhost:5432/treachery';
const sql = postgres(DATABASE_URL);

async function migrate() {
  try {
    console.log('Dropping existing tables...');
    await sql`DROP TABLE IF EXISTS rulings CASCADE`;
    await sql`DROP TABLE IF EXISTS players CASCADE`;
    await sql`DROP TABLE IF EXISTS rooms CASCADE`;
    await sql`DROP TABLE IF EXISTS cards CASCADE`;
    console.log('Tables dropped');

    console.log('Creating rooms table...');
    await sql`
      CREATE TABLE rooms (
        id text PRIMARY KEY NOT null,
        code text not null,
        status text default 'waiting' not null,
        created_at timestamp default now(),
        constraint rooms_code_unique unique(code)
      )
    `;
    console.log('Created rooms table');

    console.log('Creating players table...');
    await sql`
      CREATE TABLE players (
        id text PRIMARY KEY not null,
        room_id text not null,
        name text not null,
        role text,
        is_creator boolean default false,
        joined_at timestamp default now(),
        constraint players_room_id_rooms_id_fk foreign key (room_id) references rooms(id) on delete cascade
      )
    `;
    console.log('Created players table');

    console.log('Creating cards table...');
    await sql`
      CREATE TABLE cards (
        id integer PRIMARY KEY NOT null,
        name text NOT null,
        name_anchor text NOT null UNIQUE,
        uri text NOT null,
        cost text DEFAULT '',
        cmc integer DEFAULT 0,
        color text NOT null,
        type text NOT null,
        supertype text,
        subtype text,
        rarity text NOT null,
        text text NOT null,
        flavor text DEFAULT '',
        artist text NOT null,
        set_code text NOT null DEFAULT 'TRD-2025'
      )
    `;
    console.log('Created cards table');

    console.log('Creating rulings table...');
    await sql`
      CREATE TABLE rulings (
        id serial PRIMARY KEY NOT null,
        card_id integer NOT null REFERENCES cards(id) ON DELETE CASCADE,
        text text NOT null
      )
    `;
    console.log('Created rulings table');

    console.log('Migration completed successfully');
    console.log('');
    console.log('Run "pnpm tsx scripts/seed-api.ts" to seed the card data from the API');
  } catch (error) {
    console.error('Migration failed:', error.message);
    process.exit(1);
  } finally {
    await sql.end();
  }
}

migrate();
