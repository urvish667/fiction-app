-- Add status field to Story model
ALTER TABLE "Story" ADD COLUMN "status" TEXT NOT NULL DEFAULT 'ongoing';

-- Add isDraft and publishDate fields to Chapter model
ALTER TABLE "Chapter" ADD COLUMN "isDraft" BOOLEAN NOT NULL DEFAULT true;
ALTER TABLE "Chapter" ADD COLUMN "publishDate" TIMESTAMP(3);

-- Create index for isDraft field on Chapter
CREATE INDEX "Chapter_isDraft_idx" ON "Chapter"("isDraft");

-- Create index for publishDate field on Chapter
CREATE INDEX "Chapter_publishDate_idx" ON "Chapter"("publishDate");
