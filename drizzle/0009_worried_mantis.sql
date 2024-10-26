ALTER TABLE "trash" ADD CONSTRAINT "trash_folder_id_unique" UNIQUE("folder_id");--> statement-breakpoint
ALTER TABLE "trash" ADD CONSTRAINT "trash_file_id_unique" UNIQUE("file_id");