ALTER TABLE "trash" DROP CONSTRAINT "trash_folder_id_folder_id_fk";
--> statement-breakpoint
ALTER TABLE "trash" DROP CONSTRAINT "trash_file_id_file_id_fk";
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "trash" ADD CONSTRAINT "trash_folder_id_folder_id_fk" FOREIGN KEY ("folder_id") REFERENCES "public"."folder"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "trash" ADD CONSTRAINT "trash_file_id_file_id_fk" FOREIGN KEY ("file_id") REFERENCES "public"."file"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
