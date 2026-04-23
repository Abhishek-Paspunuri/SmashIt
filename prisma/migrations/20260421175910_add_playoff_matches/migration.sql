/*
  Warnings:

  - You are about to drop the column `phone` on the `Player` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "Player" DROP COLUMN "phone";

-- CreateTable
CREATE TABLE "PlayoffMatch" (
    "id" TEXT NOT NULL,
    "tournamentId" TEXT NOT NULL,
    "round" INTEGER NOT NULL,
    "sequence" INTEGER NOT NULL,
    "homeTeamId" TEXT,
    "awayTeamId" TEXT,
    "homeSlot" TEXT NOT NULL,
    "awaySlot" TEXT NOT NULL,
    "homeFromMatchId" TEXT,
    "homeFromResult" TEXT,
    "awayFromMatchId" TEXT,
    "awayFromResult" TEXT,
    "status" "MatchStatus" NOT NULL DEFAULT 'UPCOMING',
    "homeScore" INTEGER,
    "awayScore" INTEGER,
    "winnerId" TEXT,
    "completedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PlayoffMatch_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "PlayoffMatch_tournamentId_idx" ON "PlayoffMatch"("tournamentId");

-- AddForeignKey
ALTER TABLE "PlayoffMatch" ADD CONSTRAINT "PlayoffMatch_tournamentId_fkey" FOREIGN KEY ("tournamentId") REFERENCES "Tournament"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PlayoffMatch" ADD CONSTRAINT "PlayoffMatch_homeTeamId_fkey" FOREIGN KEY ("homeTeamId") REFERENCES "Team"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PlayoffMatch" ADD CONSTRAINT "PlayoffMatch_awayTeamId_fkey" FOREIGN KEY ("awayTeamId") REFERENCES "Team"("id") ON DELETE SET NULL ON UPDATE CASCADE;
