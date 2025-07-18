/*
  Warnings:

  - A unique constraint covering the columns `[externalDonationId]` on the table `Donation` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "PaymentMethod" ADD VALUE 'KOFI';
ALTER TYPE "PaymentMethod" ADD VALUE 'BMC';

-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "PayoutProvider" ADD VALUE 'BMC';
ALTER TYPE "PayoutProvider" ADD VALUE 'KOFI';

-- AlterTable
ALTER TABLE "Donation" ADD COLUMN     "externalDonationId" TEXT,
ADD COLUMN     "externalRawPayload" JSONB;

-- CreateIndex
CREATE UNIQUE INDEX "Donation_externalDonationId_key" ON "Donation"("externalDonationId");
