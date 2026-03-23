import postgres from "postgres";
const sql = postgres(process.env.DATABASE_URL);

const rooms = await sql`
  SELECT column_name, data_type, is_nullable, column_default
  FROM information_schema.columns 
  WHERE table_name = 'rooms'
  ORDER BY ordinal_position
`;
console.log("Rooms schema:");
console.log(JSON.stringify(rooms, null, 2));

const players = await sql`
  SELECT column_name, data_type, is_nullable, column_default
  FROM information_schema.columns 
  WHERE table_name = 'players'
  ORDER BY ordinal_position
`;
console.log("\nPlayers schema:");
console.log(JSON.stringify(players, null, 2));

await sql.end();
