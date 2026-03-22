import postgres from 'postgres';

const sql = postgres(process.env.DATABASE_URL || 'postgres://postgres:secret@localhost:5432/treachery');

export async function initDB() {
  await sql`
    CREATE TABLE IF NOT EXISTS rooms (
      id TEXT PRIMARY KEY,
      code TEXT UNIQUE NOT NULL,
      status TEXT NOT NULL DEFAULT 'waiting', 
      created_at TIMESTAMP DEFAULT NOW()
    )
  `;

  await sql`
    CREATE TABLE IF NOT EXISTS players (
      id TEXT PRIMARY KEY,
      room_id TEXT NOT NULL,
      name TEXT NOT NULL,
      role TEXT,
      is_creator BOOLEAN DEFAULT false,
      joined_at TIMESTAMP DEFAULT NOW(),
      FOREIGN KEY (room_id) REFERENCES rooms(id) ON DELETE CASCADE
    )
  `;
}

initDB();

export default sql;
