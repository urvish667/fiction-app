/*
  Warnings:

  - You are about to drop the `ForumMessage` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "ForumMessage" DROP CONSTRAINT "ForumMessage_forumId_fkey";

-- DropForeignKey
ALTER TABLE "ForumMessage" DROP CONSTRAINT "ForumMessage_senderId_fkey";

-- DropTable
DROP TABLE "ForumMessage";

-- CreateTable
CREATE TABLE "ForumPost" (
    "id" TEXT NOT NULL,
    "forumId" TEXT NOT NULL,
    "authorId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "contentKey" TEXT,
    "pinned" BOOLEAN NOT NULL DEFAULT false,
    "pinnedOrder" INTEGER,
    "pinnedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deleted" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "ForumPost_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ForumPostComment" (
    "id" TEXT NOT NULL,
    "postId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "parentId" TEXT,
    "content" VARCHAR(2000) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "editedAt" TIMESTAMP(3),
    "deleted" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "ForumPostComment_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "ForumPost_forumId_idx" ON "ForumPost"("forumId");

-- CreateIndex
CREATE INDEX "ForumPost_authorId_idx" ON "ForumPost"("authorId");

-- CreateIndex
CREATE INDEX "ForumPost_pinned_idx" ON "ForumPost"("pinned");

-- CreateIndex
CREATE INDEX "ForumPost_pinnedOrder_idx" ON "ForumPost"("pinnedOrder");

-- CreateIndex
CREATE INDEX "ForumPostComment_postId_idx" ON "ForumPostComment"("postId");

-- CreateIndex
CREATE INDEX "ForumPostComment_userId_idx" ON "ForumPostComment"("userId");

-- CreateIndex
CREATE INDEX "ForumPostComment_parentId_idx" ON "ForumPostComment"("parentId");

-- AddForeignKey
ALTER TABLE "ForumPost" ADD CONSTRAINT "ForumPost_forumId_fkey" FOREIGN KEY ("forumId") REFERENCES "AuthorForum"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ForumPost" ADD CONSTRAINT "ForumPost_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ForumPostComment" ADD CONSTRAINT "ForumPostComment_postId_fkey" FOREIGN KEY ("postId") REFERENCES "ForumPost"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ForumPostComment" ADD CONSTRAINT "ForumPostComment_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ForumPostComment" ADD CONSTRAINT "ForumPostComment_parentId_fkey" FOREIGN KEY ("parentId") REFERENCES "ForumPostComment"("id") ON DELETE SET NULL ON UPDATE CASCADE;
