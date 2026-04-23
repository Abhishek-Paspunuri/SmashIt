import { prisma } from "@/lib/prisma";

export async function getMatch(id: string) {
  return prisma.match.findUnique({
    where: { id },
    include: {
      homeTeam: { include: { members: { include: { player: true } } } },
      awayTeam: { include: { members: { include: { player: true } } } },
      tournament: { select: { ownerId: true, name: true } },
    },
  });
}

export async function startMatch(id: string, ownerId: string) {
  const match = await prisma.match.findFirst({
    where: { id, tournament: { ownerId }, status: "UPCOMING" },
  });
  if (!match) throw new Error("Match not found or already started");

  return prisma.match.update({
    where: { id },
    data: { status: "LIVE", startedAt: new Date() },
  });
}

export interface CompleteMatchInput {
  winnerId: string;
  homeScore: number;
  awayScore: number;
}

export async function completeMatch(id: string, ownerId: string, input: CompleteMatchInput) {
  const match = await prisma.match.findFirst({
    where: {
      id,
      tournament: { ownerId },
      status: { in: ["UPCOMING", "LIVE"] },
    },
  });
  if (!match) throw new Error("Match not found");

  // Validate: winner must be home or away team
  if (input.winnerId !== match.homeTeamId && input.winnerId !== match.awayTeamId) {
    throw new Error("Invalid winner");
  }

  const updated = await prisma.match.update({
    where: { id },
    data: {
      status: "COMPLETED",
      homeScore: input.homeScore,
      awayScore: input.awayScore,
      winnerId: input.winnerId,
      completedAt: new Date(),
      startedAt: match.startedAt ?? new Date(),
    },
  });

  // Log activity
  await prisma.activityLog.create({
    data: {
      userId: ownerId,
      action: "MATCH_COMPLETED",
      entityType: "Match",
      entityId: id,
      metadata: { homeScore: input.homeScore, awayScore: input.awayScore, winnerId: input.winnerId },
    },
  });

  return updated;
}

export async function updateMatch(id: string, ownerId: string, input: CompleteMatchInput) {
  const match = await prisma.match.findFirst({
    where: { id, tournament: { ownerId }, status: "COMPLETED" },
  });
  if (!match) throw new Error("Match not found or not completed");

  if (input.winnerId !== match.homeTeamId && input.winnerId !== match.awayTeamId) {
    throw new Error("Invalid winner");
  }

  return prisma.match.update({
    where: { id },
    data: {
      homeScore: input.homeScore,
      awayScore: input.awayScore,
      winnerId: input.winnerId,
    },
  });
}
