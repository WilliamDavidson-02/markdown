CREATE TABLE IF NOT EXISTS "github_file" (
	"id" text PRIMARY KEY NOT NULL,
	"repository_id" integer NOT NULL,
	"file_id" uuid,
	CONSTRAINT "github_file_file_id_unique" UNIQUE("file_id")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "github_folder" (
	"id" text PRIMARY KEY NOT NULL,
	"repository_id" integer NOT NULL,
	"folder_id" uuid,
	CONSTRAINT "github_folder_folder_id_unique" UNIQUE("folder_id")
);
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "github_file" ADD CONSTRAINT "github_file_repository_id_repository_id_fk" FOREIGN KEY ("repository_id") REFERENCES "public"."repository"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "github_file" ADD CONSTRAINT "github_file_file_id_file_id_fk" FOREIGN KEY ("file_id") REFERENCES "public"."file"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "github_folder" ADD CONSTRAINT "github_folder_repository_id_repository_id_fk" FOREIGN KEY ("repository_id") REFERENCES "public"."repository"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "github_folder" ADD CONSTRAINT "github_folder_folder_id_folder_id_fk" FOREIGN KEY ("folder_id") REFERENCES "public"."folder"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
