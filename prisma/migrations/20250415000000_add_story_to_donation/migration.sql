-- Add storyId field to Donation model
ALTER TABLE "Donation" ADD COLUMN "storyId" TEXT;

-- Add foreign key constraint
ALTER TABLE "Donation" ADD CONSTRAINT "Donation_storyId_fkey" FOREIGN KEY ("storyId") REFERENCES "Story"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- Add index for storyId
CREATE INDEX "Donation_storyId_idx" ON "Donation"("storyId");
