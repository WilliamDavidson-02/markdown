ALTER TABLE "file" DROP CONSTRAINT "file_user_id_user_id_fk";
--> statement-breakpoint
ALTER TABLE "file" DROP CONSTRAINT "file_folder_id_folder_id_fk";
--> statement-breakpoint
ALTER TABLE "folder" DROP CONSTRAINT "folder_user_id_user_id_fk";
--> statement-breakpoint
ALTER TABLE "folder" DROP CONSTRAINT "parent_reference";
--> statement-breakpoint
ALTER TABLE "trash" DROP CONSTRAINT "trash_user_id_user_id_fk";
--> statement-breakpoint
ALTER TABLE "trash" DROP CONSTRAINT "trash_folder_id_folder_id_fk";
--> statement-breakpoint
ALTER TABLE "trash" DROP CONSTRAINT "trash_file_id_file_id_fk";
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "file" ADD CONSTRAINT "file_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "file" ADD CONSTRAINT "file_folder_id_folder_id_fk" FOREIGN KEY ("folder_id") REFERENCES "public"."folder"("id") ON DELETE set null ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "folder" ADD CONSTRAINT "folder_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "folder" ADD CONSTRAINT "parent_reference" FOREIGN KEY ("parent_id") REFERENCES "public"."folder"("id") ON DELETE set null ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "trash" ADD CONSTRAINT "trash_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "trash" ADD CONSTRAINT "trash_folder_id_folder_id_fk" FOREIGN KEY ("folder_id") REFERENCES "public"."folder"("id") ON DELETE set null ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "trash" ADD CONSTRAINT "trash_file_id_file_id_fk" FOREIGN KEY ("file_id") REFERENCES "public"."file"("id") ON DELETE set null ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
