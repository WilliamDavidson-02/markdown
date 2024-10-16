ALTER TABLE "user" 
ALTER COLUMN "github_id" SET DATA TYPE integer 
USING (github_id::integer);