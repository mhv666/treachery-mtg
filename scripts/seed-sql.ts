import postgres from 'postgres';
import { readFileSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));

const DATABASE_URL = process.env.DATABASE_URL || 'postgres://postgres:secret@localhost:5432/treachery';
const sql = postgres(DATABASE_URL);

async function seed() {
  try {
    console.log('Clearing existing card data...');
    await sql`DELETE FROM rulings`;
    await sql`DELETE FROM cards`;
    console.log('Cleared existing data');

    console.log('Loading seed.sql...');
    const seedPath = resolve(__dirname, '../drizzle/seed.sql');
    const seedSql = readFileSync(seedPath, 'utf-8');
    
    await sql.unsafe(seedSql);
    console.log('Seed data inserted successfully from SQL dump');
  } catch (error) {
    console.error('Seed failed:', error);
    process.exit(1);
  } finally {
    await sql.end();
  }
}

seed();
