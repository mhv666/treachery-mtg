CREATE TABLE "cards" (
	"id" integer PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"name_anchor" text NOT NULL,
	"uri" text NOT NULL,
	"cost" text DEFAULT '',
	"cmc" integer DEFAULT 0,
	"color" text NOT NULL,
	"type" text NOT NULL,
	"supertype" text,
	"subtype" text,
	"rarity" text NOT NULL,
	"text" text NOT NULL,
	"flavor" text DEFAULT '',
	"artist" text NOT NULL,
	"set_code" text DEFAULT 'TRD-2025' NOT NULL,
	CONSTRAINT "cards_name_anchor_unique" UNIQUE("name_anchor")
);
--> statement-breakpoint
CREATE TABLE "rulings" (
	"id" serial PRIMARY KEY NOT NULL,
	"card_id" integer NOT NULL,
	"text" text NOT NULL
);
--> statement-breakpoint
ALTER TABLE "rulings" ADD CONSTRAINT "rulings_card_id_cards_id_fk" FOREIGN KEY ("card_id") REFERENCES "public"."cards"("id") ON DELETE cascade ON UPDATE no action;