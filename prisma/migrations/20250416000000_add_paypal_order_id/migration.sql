-- AlterTable
ALTER TABLE "Donation" ADD COLUMN "paypalOrderId" TEXT;

-- CreateIndex
CREATE INDEX "Donation_paypalOrderId_idx" ON "Donation"("paypalOrderId");
