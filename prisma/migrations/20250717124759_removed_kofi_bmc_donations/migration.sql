/*
  Warnings:

  - The values [KOFI,BMC] on the enum `PaymentMethod` will be removed. If these variants are still used in the database, this will fail.
  - The values [BMC,KOFI] on the enum `PayoutProvider` will be removed. If these variants are still used in the database, this will fail.
  - You are about to drop the column `externalDonationId` on the `Donation` table. All the data in the column will be lost.
  - You are about to drop the column `externalRawPayload` on the `Donation` table. All the data in the column will be lost.
  - You are about to drop the column `status` on the `Donation` table. All the data in the column will be lost.

*/
-- AlterEnum
BEGIN;
CREATE TYPE "PaymentMethod_new" AS ENUM ('PAYPAL', 'STRIPE', 'MANUAL');
ALTER TABLE "Donation" ALTER COLUMN "paymentMethod" TYPE "PaymentMethod_new" USING ("paymentMethod"::text::"PaymentMethod_new");
ALTER TYPE "PaymentMethod" RENAME TO "PaymentMethod_old";
ALTER TYPE "PaymentMethod_new" RENAME TO "PaymentMethod";
DROP TYPE "PaymentMethod_old";
COMMIT;

-- AlterEnum
BEGIN;
CREATE TYPE "PayoutProvider_new" AS ENUM ('PAYPAL', 'STRIPE');
ALTER TABLE "User" ALTER COLUMN "donationMethod" TYPE "PayoutProvider_new" USING ("donationMethod"::text::"PayoutProvider_new");
ALTER TYPE "PayoutProvider" RENAME TO "PayoutProvider_old";
ALTER TYPE "PayoutProvider_new" RENAME TO "PayoutProvider";
DROP TYPE "PayoutProvider_old";
COMMIT;

-- DropIndex
DROP INDEX "Donation_externalDonationId_key";

-- AlterTable
ALTER TABLE "Donation" DROP COLUMN "externalDonationId",
DROP COLUMN "externalRawPayload",
DROP COLUMN "status";
