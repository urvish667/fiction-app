-- Replace isDraft with status in Chapter model
ALTER TABLE "Chapter" ADD COLUMN "status" TEXT NOT NULL DEFAULT 'draft';

-- Update status based on isDraft value
UPDATE "Chapter" SET "status" = CASE WHEN "isDraft" = true THEN 'draft' ELSE 'published' END;

-- Create index on status
CREATE INDEX "Chapter_status_idx" ON "Chapter"("status");

-- Remove isDraft column
ALTER TABLE "Chapter" DROP COLUMN "isDraft";
