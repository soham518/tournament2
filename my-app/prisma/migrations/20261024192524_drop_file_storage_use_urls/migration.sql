/*
  Warnings:

  - You are about to drop the column `portraitImageKey` on the `Fighter` table. All the data in the column will be lost.
  - You are about to drop the column `profileImageKey` on the `PlayerProfile` table. All the data in the column will be lost.
  - You are about to drop the column `coverImageKey` on the `Tournament` table. All the data in the column will be lost.
  - You are about to drop the column `qrCodeImageKey` on the `TournamentPaymentConfig` table. All the data in the column will be lost.
  - You are about to drop the column `screenshotRequired` on the `TournamentPaymentConfig` table. All the data in the column will be lost.
  - You are about to drop the `MatchEvidence` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `PaymentEvidence` table. If the table is not empty, all the data it contains will be lost.
  - Added the required column `qrCodeImageUrl` to the `TournamentPaymentConfig` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "MatchEvidence" DROP CONSTRAINT "MatchEvidence_matchResultId_fkey";

-- DropForeignKey
ALTER TABLE "MatchEvidence" DROP CONSTRAINT "MatchEvidence_uploadedById_fkey";

-- DropForeignKey
ALTER TABLE "PaymentEvidence" DROP CONSTRAINT "PaymentEvidence_paymentId_fkey";

-- AlterTable
ALTER TABLE "Fighter" DROP COLUMN "portraitImageKey",
ADD COLUMN     "portraitImageUrl" TEXT;

-- AlterTable
ALTER TABLE "MatchResult" ADD COLUMN     "evidenceUrl" TEXT;

-- AlterTable
ALTER TABLE "PlayerProfile" DROP COLUMN "profileImageKey",
ADD COLUMN     "profileImageUrl" TEXT;

-- AlterTable
ALTER TABLE "Tournament" DROP COLUMN "coverImageKey",
ADD COLUMN     "coverImageUrl" TEXT;

-- AlterTable
ALTER TABLE "TournamentPaymentConfig" DROP COLUMN "qrCodeImageKey",
DROP COLUMN "screenshotRequired",
ADD COLUMN     "qrCodeImageUrl" TEXT NOT NULL,
ADD COLUMN     "screenshotDiscordUrl" TEXT;

-- DropTable
DROP TABLE "MatchEvidence";

-- DropTable
DROP TABLE "PaymentEvidence";
