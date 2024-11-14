ALTER TABLE "github_file" ALTER COLUMN "sha" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "github_folder" ALTER COLUMN "sha" DROP NOT NULL;