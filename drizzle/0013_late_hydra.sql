ALTER TABLE "github_file" ALTER COLUMN "id" SET DATA TYPE uuid USING id::uuid;--> statement-breakpoint
ALTER TABLE "github_file" ALTER COLUMN "id" SET DEFAULT gen_random_uuid();--> statement-breakpoint
ALTER TABLE "github_folder" ALTER COLUMN "id" SET DATA TYPE uuid USING id::uuid;--> statement-breakpoint
ALTER TABLE "github_folder" ALTER COLUMN "id" SET DEFAULT gen_random_uuid();--> statement-breakpoint
ALTER TABLE "github_file" ADD COLUMN "sha" text NOT NULL;--> statement-breakpoint
ALTER TABLE "github_folder" ADD COLUMN "sha" text NOT NULL;