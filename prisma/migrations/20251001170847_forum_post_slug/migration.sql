/*
  Warnings:

  - You are about to drop the `AuthorForum` table. If the table is not empty, all the data it contains will be lost.
  - A unique constraint covering the columns `[slug]` on the table `ForumPost` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `slug` to the `ForumPost` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "ForumType" AS ENUM ('AUTHOR', 'GENRE', 'FANDOM');

-- DropForeignKey
ALTER TABLE "AuthorForum" DROP CONSTRAINT "AuthorForum_authorId_fkey";

-- DropForeignKey
ALTER TABLE "ForumBan" DROP CONSTRAINT "ForumBan_forumId_fkey";

-- DropForeignKey
ALTER TABLE "ForumPost" DROP CONSTRAINT "ForumPost_forumId_fkey";

-- AlterTable
ALTER TABLE "ForumPost" ADD COLUMN     "slug" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "ForumPostComment" ALTER COLUMN "content" SET DATA TYPE VARCHAR(3000);

-- DropTable
DROP TABLE "AuthorForum";

-- CreateTable
CREATE TABLE "Forum" (
    "id" TEXT NOT NULL,
    "type" "ForumType" NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "authorId" TEXT,
    "genreId" TEXT,
    "fandomId" TEXT,

    CONSTRAINT "Forum_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Forum_slug_key" ON "Forum"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "ForumPost_slug_key" ON "ForumPost"("slug");

-- AddForeignKey
ALTER TABLE "Forum" ADD CONSTRAINT "Forum_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Forum" ADD CONSTRAINT "Forum_genreId_fkey" FOREIGN KEY ("genreId") REFERENCES "Genre"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ForumPost" ADD CONSTRAINT "ForumPost_forumId_fkey" FOREIGN KEY ("forumId") REFERENCES "Forum"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ForumBan" ADD CONSTRAINT "ForumBan_forumId_fkey" FOREIGN KEY ("forumId") REFERENCES "Forum"("id") ON DELETE CASCADE ON UPDATE CASCADE;
