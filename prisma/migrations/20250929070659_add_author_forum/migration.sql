-- AlterTable
ALTER TABLE "User" ALTER COLUMN "preferences" SET DEFAULT '{"privacySettings": {"showEmail": false, "showLocation": false, "allowMessages": false, "publicProfile": false, "forum": false}, "emailNotifications": {"newLike": false, "newChapter": false, "newComment": false, "newFollower": false}}';

-- CreateTable
CREATE TABLE "AuthorForum" (
    "id" TEXT NOT NULL,
    "authorId" TEXT NOT NULL,
    "settings" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AuthorForum_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ForumMessage" (
    "id" TEXT NOT NULL,
    "forumId" TEXT NOT NULL,
    "senderId" TEXT NOT NULL,
    "content" VARCHAR(2000) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "editedAt" TIMESTAMP(3),
    "deleted" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "ForumMessage_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ForumBan" (
    "id" TEXT NOT NULL,
    "forumId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "reason" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ForumBan_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "AuthorForum_authorId_key" ON "AuthorForum"("authorId");

-- CreateIndex
CREATE UNIQUE INDEX "ForumBan_forumId_userId_key" ON "ForumBan"("forumId", "userId");

-- AddForeignKey
ALTER TABLE "AuthorForum" ADD CONSTRAINT "AuthorForum_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ForumMessage" ADD CONSTRAINT "ForumMessage_forumId_fkey" FOREIGN KEY ("forumId") REFERENCES "AuthorForum"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ForumMessage" ADD CONSTRAINT "ForumMessage_senderId_fkey" FOREIGN KEY ("senderId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ForumBan" ADD CONSTRAINT "ForumBan_forumId_fkey" FOREIGN KEY ("forumId") REFERENCES "AuthorForum"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ForumBan" ADD CONSTRAINT "ForumBan_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
