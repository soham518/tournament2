-- AlterEnum
ALTER TYPE "TournamentStatus" ADD VALUE 'COMPLETED';

-- AlterTable
ALTER TABLE "Tournament" ADD COLUMN     "completedAt" TIMESTAMP(3),
ADD COLUMN     "winnerRegistrationId" TEXT;

-- AddForeignKey
ALTER TABLE "Tournament" ADD CONSTRAINT "Tournament_winnerRegistrationId_fkey" FOREIGN KEY ("winnerRegistrationId") REFERENCES "TournamentRegistration"("id") ON DELETE SET NULL ON UPDATE CASCADE;

