/*
  Warnings:

  - The `donationMethod` column on the `User` table would be dropped and recreated. This will lead to data loss if there is data in the column.

*/
-- CreateEnum
CREATE TYPE "PayoutProvider" AS ENUM ('PAYPAL', 'STRIPE');

-- AlterTable
ALTER TABLE "User" DROP COLUMN "donationMethod",
ADD COLUMN     "donationMethod" "PayoutProvider";
