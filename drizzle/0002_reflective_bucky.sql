CREATE TABLE "player_cards" (
	"id" serial PRIMARY KEY NOT NULL,
	"player_id" text NOT NULL,
	"card_id" integer NOT NULL,
	"dealt_at" timestamp DEFAULT now()
);
--> statement-breakpoint
ALTER TABLE "rooms" ADD COLUMN "game_phase" text DEFAULT 'waiting' NOT NULL;--> statement-breakpoint
ALTER TABLE "player_cards" ADD CONSTRAINT "player_cards_player_id_players_id_fk" FOREIGN KEY ("player_id") REFERENCES "public"."players"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "player_cards" ADD CONSTRAINT "player_cards_card_id_cards_id_fk" FOREIGN KEY ("card_id") REFERENCES "public"."cards"("id") ON DELETE cascade ON UPDATE no action;