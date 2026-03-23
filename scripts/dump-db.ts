import postgres from "postgres";
import { writeFileSync } from "fs";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));

const DATABASE_URL =
  process.env.DATABASE_URL ||
  "postgres://postgres:secret@localhost:5432/treachery";
const sql = postgres(DATABASE_URL);

function escapeSql(str: string): string {
  if (str === null || str === undefined) return "NULL";
  return str.replace(/'/g, "''");
}

async function dump() {
  try {
    console.log("Fetching data from database...");

    const cards = await sql`SELECT * FROM cards ORDER BY id`;
    const rulings = await sql`SELECT * FROM rulings ORDER BY id`;

    console.log(`Found ${cards.length} cards and ${rulings.length} rulings`);

    let sqlContent = `-- SQL dump of MTG Treachery card data
-- Generated from database on ${new Date().toISOString()}
-- Source: https://mtgtreachery.net/rules/oracle/treachery-cards.json

-- Cards table
INSERT INTO cards (id, name, name_anchor, uri, cost, cmc, color, type, supertype, subtype, rarity, text, flavor, artist, set_code) VALUES
`;

    const cardValues = cards.map((card) => {
      return `(${card.id}, '${escapeSql(card.name)}', '${escapeSql(card.name_anchor)}', '${escapeSql(card.uri)}', '${escapeSql(card.cost)}', ${card.cmc}, '${escapeSql(card.color)}', '${escapeSql(card.type)}', ${card.supertype ? `'${escapeSql(card.supertype)}'` : "NULL"}, ${card.subtype ? `'${escapeSql(card.subtype)}'` : "NULL"}, '${escapeSql(card.rarity)}', '${escapeSql(card.text)}', '${escapeSql(card.flavor)}', '${escapeSql(card.artist)}', '${escapeSql(card.set_code)}')`;
    });

    sqlContent += cardValues.join(",\n") + ";\n\n";

    sqlContent += `-- Rulings table
INSERT INTO rulings (id, card_id, text) VALUES
`;

    const rulingValues = rulings.map((ruling) => {
      return `(${ruling.id}, ${ruling.card_id}, '${escapeSql(ruling.text)}')`;
    });

    sqlContent += rulingValues.join(",\n") + ";\n";

    const outputPath = resolve(__dirname, "../drizzle/seed.sql");
    writeFileSync(outputPath, sqlContent);
    console.log(`Dump written to ${outputPath}`);
    console.log(`Total: ${cards.length} cards, ${rulings.length} rulings`);
  } catch (error) {
    console.error("Dump failed:", error);
    process.exit(1);
  } finally {
    await sql.end();
  }
}

dump();
