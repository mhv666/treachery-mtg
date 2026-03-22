import postgres from 'postgres';
const sql = postgres(process.env.DATABASE_URL);

async function check() {
  const cards = await sql`SELECT id, name, color, rarity FROM cards ORDER BY id LIMIT 10`;
  console.log('Sample cards:');
  console.log(JSON.stringify(cards, null, 2));
  
  const count = await sql`SELECT count(*) as total FROM cards`;
  console.log('Total cards:', count[0].total);
  
  const rulingsCount = await sql`SELECT count(*) as total FROM rulings`;
  console.log('Total rulings:', rulingsCount[0].total);
  
  await sql.end();
}

check();
