/*
  Warnings:

  - You are about to drop the column `genre` on the `Story` table. All the data in the column will be lost.
  - You are about to drop the column `language` on the `Story` table. All the data in the column will be lost.

*/
-- DropIndex
DROP INDEX "Story_genre_idx";

-- AlterTable
ALTER TABLE "Story" DROP COLUMN "genre",
DROP COLUMN "language",
ADD COLUMN     "genreId" TEXT,
ADD COLUMN     "languageId" TEXT;

-- CreateTable
CREATE TABLE "Tag" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,

    CONSTRAINT "Tag_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "StoryTag" (
    "id" TEXT NOT NULL,
    "storyId" TEXT NOT NULL,
    "tagId" TEXT NOT NULL,

    CONSTRAINT "StoryTag_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Genre" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,

    CONSTRAINT "Genre_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Language" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,

    CONSTRAINT "Language_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Tag_name_key" ON "Tag"("name");

-- CreateIndex
CREATE INDEX "StoryTag_tagId_idx" ON "StoryTag"("tagId");

-- CreateIndex
CREATE UNIQUE INDEX "StoryTag_storyId_tagId_key" ON "StoryTag"("storyId", "tagId");

-- CreateIndex
CREATE UNIQUE INDEX "Genre_name_key" ON "Genre"("name");

-- CreateIndex
CREATE UNIQUE INDEX "Language_name_key" ON "Language"("name");

-- AddForeignKey
ALTER TABLE "Story" ADD CONSTRAINT "Story_genreId_fkey" FOREIGN KEY ("genreId") REFERENCES "Genre"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Story" ADD CONSTRAINT "Story_languageId_fkey" FOREIGN KEY ("languageId") REFERENCES "Language"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StoryTag" ADD CONSTRAINT "StoryTag_storyId_fkey" FOREIGN KEY ("storyId") REFERENCES "Story"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StoryTag" ADD CONSTRAINT "StoryTag_tagId_fkey" FOREIGN KEY ("tagId") REFERENCES "Tag"("id") ON DELETE CASCADE ON UPDATE CASCADE;
