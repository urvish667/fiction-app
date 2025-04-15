/*
  Warnings:

  - Added the required column `paymentMethod` to the `Donation` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Donation" ADD COLUMN     "paymentMethod" TEXT NOT NULL,
ALTER COLUMN "stripePaymentIntentId" DROP NOT NULL;
