-- CreateTable
CREATE TABLE "StoryRecommendation" (
    "id" TEXT NOT NULL,
    "storyId" TEXT NOT NULL,
    "recommendedStoryId" TEXT NOT NULL,
    "score" DOUBLE PRECISION NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "StoryRecommendation_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "StoryRecommendation_storyId_idx" ON "StoryRecommendation"("storyId");

-- CreateIndex
CREATE INDEX "StoryRecommendation_recommendedStoryId_idx" ON "StoryRecommendation"("recommendedStoryId");

-- CreateIndex
CREATE INDEX "StoryRecommendation_score_idx" ON "StoryRecommendation"("score");

-- CreateIndex
CREATE UNIQUE INDEX "StoryRecommendation_storyId_recommendedStoryId_key" ON "StoryRecommendation"("storyId", "recommendedStoryId");

-- AddForeignKey
ALTER TABLE "StoryRecommendation" ADD CONSTRAINT "StoryRecommendation_storyId_fkey" FOREIGN KEY ("storyId") REFERENCES "Story"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StoryRecommendation" ADD CONSTRAINT "StoryRecommendation_recommendedStoryId_fkey" FOREIGN KEY ("recommendedStoryId") REFERENCES "Story"("id") ON DELETE CASCADE ON UPDATE CASCADE;
