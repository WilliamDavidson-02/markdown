ALTER TABLE "github_file" DROP CONSTRAINT "github_file_file_id_file_id_fk";
--> statement-breakpoint
ALTER TABLE "github_folder" DROP CONSTRAINT "github_folder_folder_id_folder_id_fk";
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "github_file" ADD CONSTRAINT "github_file_file_id_file_id_fk" FOREIGN KEY ("file_id") REFERENCES "public"."file"("id") ON DELETE set null ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "github_folder" ADD CONSTRAINT "github_folder_folder_id_folder_id_fk" FOREIGN KEY ("folder_id") REFERENCES "public"."folder"("id") ON DELETE set null ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
