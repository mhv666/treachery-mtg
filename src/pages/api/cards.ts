import type { APIRoute } from "astro";
import { db } from "../../db";
import { cards } from "../../db/schema";
import { like } from "drizzle-orm";
import type { Role } from "../../lib/game";

export const GET: APIRoute = async ({ url }) => {
  try {
    const role = url.searchParams.get("role") as Role;

    if (!role) {
      const allCards = await db.select().from(cards);
      return new Response(JSON.stringify(allCards), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      });
    }

    const rolePattern = `%${role}%`;
    const roleCards = await db
      .select()
      .from(cards)
      .where(like(cards.subtype, rolePattern));

    return new Response(JSON.stringify(roleCards), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error: any) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
    });
  }
};
