-- CreateTable
CREATE TABLE "StoryView" (
    "id" TEXT NOT NULL,
    "userId" TEXT,
    "storyId" TEXT NOT NULL,
    "clientIp" TEXT,
    "userAgent" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "StoryView_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ChapterView" (
    "id" TEXT NOT NULL,
    "userId" TEXT,
    "chapterId" TEXT NOT NULL,
    "clientIp" TEXT,
    "userAgent" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ChapterView_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "StoryView_userId_idx" ON "StoryView"("userId");

-- CreateIndex
CREATE INDEX "StoryView_storyId_idx" ON "StoryView"("storyId");

-- CreateIndex
CREATE UNIQUE INDEX "StoryView_userId_storyId_key" ON "StoryView"("userId", "storyId") WHERE "userId" IS NOT NULL;

-- CreateIndex
CREATE INDEX "ChapterView_userId_idx" ON "ChapterView"("userId");

-- CreateIndex
CREATE INDEX "ChapterView_chapterId_idx" ON "ChapterView"("chapterId");

-- CreateIndex
CREATE UNIQUE INDEX "ChapterView_userId_chapterId_key" ON "ChapterView"("userId", "chapterId") WHERE "userId" IS NOT NULL;

-- AddForeignKey
ALTER TABLE "StoryView" ADD CONSTRAINT "StoryView_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StoryView" ADD CONSTRAINT "StoryView_storyId_fkey" FOREIGN KEY ("storyId") REFERENCES "Story"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ChapterView" ADD CONSTRAINT "ChapterView_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ChapterView" ADD CONSTRAINT "ChapterView_chapterId_fkey" FOREIGN KEY ("chapterId") REFERENCES "Chapter"("id") ON DELETE CASCADE ON UPDATE CASCADE;
