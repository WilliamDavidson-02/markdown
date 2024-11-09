CREATE TABLE IF NOT EXISTS "keybinding" (
	"id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "keybinding_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"key" text NOT NULL,
	"name" text NOT NULL,
	"user_id" text NOT NULL
);
--> statement-breakpoint
ALTER TABLE "settings" ALTER COLUMN "settings" SET DEFAULT '{"autoSave":true,"fontSize":16,"tabSize":4,"wordWrap":true}'::jsonb;--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "keybinding" ADD CONSTRAINT "keybinding_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
