import postgres from 'postgres';

const DATABASE_URL = process.env.DATABASE_URL || 'postgres://postgres:secret@localhost:5432/treachery';
const sql = postgres(DATABASE_URL);

async function migrate() {
  try {
    console.log('Dropping existing tables...');
    await sql`DROP TABLE IF EXISTS players CASCADE`;
    await sql`DROP TABLE IF EXISTS rooms CASCADE`;
    console.log('Tables dropped');

    const createRooms = sql`
      CREATE TABLE rooms (
        id text PRIMARY KEY NOT null,
        code text not null,
        status text default 'waiting' not null,
        created_at timestamp default now(),
        constraint rooms_code_unique unique(code)
      )
    `;
    await createRooms;
    console.log('Created rooms table');

    const createPlayers = sql`
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
    await createPlayers;
    console.log('Created players table');

    console.log('Migration completed successfully');
  } catch (error) {
    console.error('Migration failed:', error.message);
    process.exit(1);
  } finally {
    await sql.end();
  }
}

migrate();
