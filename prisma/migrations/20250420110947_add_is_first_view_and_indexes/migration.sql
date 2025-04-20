-- AlterTable
ALTER TABLE "ChapterView" ADD COLUMN     "isFirstView" BOOLEAN NOT NULL DEFAULT false;

-- AlterTable
ALTER TABLE "StoryView" ADD COLUMN     "isFirstView" BOOLEAN NOT NULL DEFAULT false;

-- CreateIndex
CREATE INDEX "ChapterView_chapterId_createdAt_idx" ON "ChapterView"("chapterId", "createdAt");

-- CreateIndex
CREATE INDEX "ChapterView_userId_chapterId_idx" ON "ChapterView"("userId", "chapterId");

-- CreateIndex
CREATE INDEX "StoryView_storyId_createdAt_idx" ON "StoryView"("storyId", "createdAt");

-- CreateIndex
CREATE INDEX "StoryView_userId_storyId_idx" ON "StoryView"("userId", "storyId");
