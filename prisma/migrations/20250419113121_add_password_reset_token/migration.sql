-- CreateTable
CREATE TABLE "PasswordResetToken" (
    "identifier" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "expires" TIMESTAMP(3) NOT NULL
);

-- CreateIndex
CREATE UNIQUE INDEX "PasswordResetToken_token_key" ON "PasswordResetToken"("token");

-- CreateIndex
CREATE INDEX "PasswordResetToken_identifier_idx" ON "PasswordResetToken"("identifier");

-- CreateIndex
CREATE INDEX "PasswordResetToken_expires_idx" ON "PasswordResetToken"("expires");

-- CreateIndex
CREATE UNIQUE INDEX "PasswordResetToken_identifier_token_key" ON "PasswordResetToken"("identifier", "token");
