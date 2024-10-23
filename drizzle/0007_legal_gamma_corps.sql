ALTER TABLE "file" ALTER COLUMN "id" SET DEFAULT gen_random_uuid();--> statement-breakpoint
ALTER TABLE "folder" ALTER COLUMN "id" SET DEFAULT gen_random_uuid();