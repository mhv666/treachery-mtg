import postgres from "postgres";

const DATABASE_URL =
  process.env.DATABASE_URL ||
  "postgres://postgres:secret@localhost:5432/treachery";
const sql = postgres(DATABASE_URL);

async function fetchWithRetry(url: string, retries = 3): Promise<any> {
  for (let i = 0; i < retries; i++) {
    try {
      const response = await fetch(url);
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      return await response.json();
    } catch (error) {
      if (i === retries - 1) throw error;
      await new Promise((r) => setTimeout(r, 1000));
    }
  }
}

async function seed() {
  try {
    console.log("Fetching card data from API...");
    const data = await fetchWithRetry(
      "https://mtgtreachery.net/rules/oracle/treachery-cards.json",
    );
    console.log(`Fetched ${data.cards_count} cards`);

    console.log("Clearing existing data...");
    await sql`DELETE FROM rulings`;
    await sql`DELETE FROM cards`;
    console.log("Cleared existing data");

    console.log("Inserting cards...");
    let inserted = 0;
    for (const card of data.cards) {
      await sql`
        INSERT INTO cards (id, name, name_anchor, uri, cost, cmc, color, type, supertype, subtype, rarity, text, flavor, artist, set_code)
        VALUES (
          ${card.id},
          ${card.name},
          ${card.name_anchor},
          ${card.uri},
          ${card.cost || ""},
          ${card.cmc || 0},
          ${card.color},
          ${card.type},
          ${card.types?.supertype || null},
          ${card.types?.subtype || null},
          ${card.rarity},
          ${card.text},
          ${card.flavor || ""},
          ${card.artist},
          ${card.set_code || "TRD-2025"}
        )
      `;
      inserted++;
      if (inserted % 10 === 0) console.log(`Inserted ${inserted} cards...`);
    }
    console.log(`Inserted ${inserted} cards`);

    console.log("Inserting rulings...");
    let rulingsInserted = 0;
    for (const card of data.cards) {
      if (card.rulings && Array.isArray(card.rulings)) {
        for (const rulingText of card.rulings) {
          await sql`INSERT INTO rulings (card_id, text) VALUES (${card.id}, ${rulingText})`;
          rulingsInserted++;
        }
      }
    }
    console.log(`Inserted ${rulingsInserted} rulings`);

    console.log("Seed completed successfully!");
  } catch (error) {
    console.error("Seed failed:", error);
    process.exit(1);
  } finally {
    await sql.end();
  }
}

seed();
