/*
  Warnings:

  - You are about to drop the column `amount` on the `Donation` table. All the data in the column will be lost.
  - The `status` column on the `Donation` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - The `paymentMethod` column on the `Donation` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - You are about to drop the column `amount` on the `Payout` table. All the data in the column will be lost.
  - You are about to drop the column `donationId` on the `Payout` table. All the data in the column will be lost.
  - You are about to drop the column `feeAmount` on the `Payout` table. All the data in the column will be lost.
  - You are about to drop the column `netAmount` on the `Payout` table. All the data in the column will be lost.
  - You are about to drop the column `updatedAt` on the `Payout` table. All the data in the column will be lost.
  - The `status` column on the `Payout` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - Added the required column `totalAmountCents` to the `Payout` table without a default value. This is not possible if the table is not empty.
  - Changed the type of `method` on the `Payout` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.

*/
-- CreateEnum
CREATE TYPE "DonationStatus" AS ENUM ('pending', 'collected', 'failed');

-- CreateEnum
CREATE TYPE "PayoutStatus" AS ENUM ('pending', 'paid_out', 'failed');

-- CreateEnum
CREATE TYPE "PaymentMethod" AS ENUM ('PAYPAL', 'STRIPE', 'MANUAL');

-- CreateEnum
CREATE TYPE "PayoutMethod" AS ENUM ('PAYPAL_EMAIL', 'STRIPE_ACCOUNT', 'BANK_TRANSFER');

-- DropForeignKey
ALTER TABLE "Payout" DROP CONSTRAINT "Payout_donationId_fkey";

-- DropIndex
DROP INDEX "Donation_createdAt_idx";

-- DropIndex
DROP INDEX "Donation_donorId_idx";

-- DropIndex
DROP INDEX "Donation_paypalOrderId_idx";

-- DropIndex
DROP INDEX "Donation_recipientId_idx";

-- DropIndex
DROP INDEX "Donation_status_idx";

-- DropIndex
DROP INDEX "Donation_storyId_idx";

-- DropIndex
DROP INDEX "Payout_donationId_key";

-- DropIndex
DROP INDEX "Payout_externalId_idx";

-- DropIndex
DROP INDEX "Payout_status_idx";

-- DropIndex
DROP INDEX "Payout_userId_idx";

-- AlterTable
ALTER TABLE "Donation" DROP COLUMN "amount",
ADD COLUMN     "amountCents" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "capturedAt" TIMESTAMP(3),
ADD COLUMN     "netAmountCents" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "paidOutAt" TIMESTAMP(3),
ADD COLUMN     "payoutId" TEXT,
ADD COLUMN     "platformFeeCents" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "processorFeeCents" INTEGER,
DROP COLUMN "status",
ADD COLUMN     "status" "DonationStatus" NOT NULL DEFAULT 'pending',
DROP COLUMN "paymentMethod",
ADD COLUMN     "paymentMethod" "PaymentMethod";

-- AlterTable
ALTER TABLE "Payout" DROP COLUMN "amount",
DROP COLUMN "donationId",
DROP COLUMN "feeAmount",
DROP COLUMN "netAmount",
DROP COLUMN "updatedAt",
ADD COLUMN     "completedAt" TIMESTAMP(3),
ADD COLUMN     "totalAmountCents" INTEGER NOT NULL,
DROP COLUMN "method",
ADD COLUMN     "method" "PayoutMethod" NOT NULL,
DROP COLUMN "status",
ADD COLUMN     "status" "PayoutStatus" NOT NULL DEFAULT 'pending';

-- AddForeignKey
ALTER TABLE "Donation" ADD CONSTRAINT "Donation_payoutId_fkey" FOREIGN KEY ("payoutId") REFERENCES "Payout"("id") ON DELETE SET NULL ON UPDATE CASCADE;
