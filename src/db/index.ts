import Database from 'better-sqlite3';

const db = new Database('treachery.db', { verbose: console.log });

// Initialize database schema
export function initDB() {
  db.exec(`
    CREATE TABLE IF NOT EXISTS rooms (
      id TEXT PRIMARY KEY,
      code TEXT UNIQUE NOT NULL,
      status TEXT NOT NULL DEFAULT 'waiting', 
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS players (
      id TEXT PRIMARY KEY,
      room_id TEXT NOT NULL,
      name TEXT NOT NULL,
      role TEXT,
      is_creator BOOLEAN DEFAULT 0,
      joined_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (room_id) REFERENCES rooms(id) ON DELETE CASCADE
    );
  `);
}

initDB();

export default db;
