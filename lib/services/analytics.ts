import { prisma } from "@/lib/prisma";

export async function getAnalytics(ownerId: string) {
  const [
    totalTournaments,
    tournamentsByStatus,
    totalPlayers,
    totalMatches,
    recentMatches,
    teamStats,
    matchesByDay,
  ] = await Promise.all([
    prisma.tournament.count({ where: { ownerId, deletedAt: null } }),

    prisma.tournament.groupBy({
      by: ["status"],
      where: { ownerId, deletedAt: null },
      _count: { id: true },
    }),

    prisma.player.count({ where: { ownerId, deletedAt: null } }),

    prisma.match.count({
      where: { tournament: { ownerId }, status: "COMPLETED" },
    }),

    prisma.match.findMany({
      where: { tournament: { ownerId }, status: "COMPLETED" },
      include: {
        homeTeam: true,
        awayTeam: true,
        tournament: { select: { name: true } },
      },
      orderBy: { completedAt: "desc" },
      take: 10,
    }),

    // Win rates by team across all tournaments
    prisma.team.findMany({
      where: { tournament: { ownerId } },
      include: {
        homeMatches: { where: { status: "COMPLETED" } },
        awayMatches: { where: { status: "COMPLETED" } },
        tournament: { select: { name: true } },
      },
    }),

    // Match count by day (last 30 days)
    prisma.$queryRaw<{ date: string; count: bigint }[]>`
      SELECT DATE("completedAt")::text as date, COUNT(*) as count
      FROM "Match"
      WHERE "completedAt" >= NOW() - INTERVAL '30 days'
        AND status = 'COMPLETED'
      GROUP BY DATE("completedAt")
      ORDER BY date ASC
    `,
  ]);

  const teamWinRates = teamStats
    .map((team) => {
      const totalMatchesPlayed = team.homeMatches.length + team.awayMatches.length;
      if (totalMatchesPlayed === 0) return null;

      const wins =
        team.homeMatches.filter((m) => m.winnerId === team.id).length +
        team.awayMatches.filter((m) => m.winnerId === team.id).length;

      return {
        teamId: team.id,
        teamName: team.name,
        tournamentName: team.tournament.name,
        wins,
        losses: totalMatchesPlayed - wins,
        winRate: Math.round((wins / totalMatchesPlayed) * 100),
      };
    })
    .filter(Boolean)
    .sort((a, b) => b!.winRate - a!.winRate)
    .slice(0, 10);

  return {
    totalTournaments,
    tournamentsByStatus: tournamentsByStatus.map((t) => ({
      status: t.status,
      count: t._count.id,
    })),
    totalPlayers,
    totalMatches,
    recentMatches,
    teamWinRates,
    matchesByDay: matchesByDay.map((row) => ({
      date: row.date,
      count: Number(row.count),
    })),
  };
}

export async function getDashboardStats(ownerId: string) {
  const [
    totalPlayers,
    totalGroups,
    activeTournaments,
    completedTournaments,
    matchesPlayed,
    recentMatches,
    recentActivity,
  ] = await Promise.all([
    prisma.player.count({ where: { ownerId, deletedAt: null } }),
    prisma.group.count({ where: { ownerId, deletedAt: null } }),
    prisma.tournament.count({ where: { ownerId, deletedAt: null, status: { in: ["LIVE", "SCHEDULED"] } } }),
    prisma.tournament.count({ where: { ownerId, deletedAt: null, status: "COMPLETED" } }),
    prisma.match.count({ where: { tournament: { ownerId }, status: "COMPLETED" } }),
    prisma.match.findMany({
      where: { tournament: { ownerId }, status: "COMPLETED" },
      include: {
        homeTeam: { include: { members: { include: { player: true } } } },
        awayTeam: { include: { members: { include: { player: true } } } },
        tournament: { select: { name: true, id: true } },
      },
      orderBy: { completedAt: "desc" },
      take: 5,
    }),
    prisma.activityLog.findMany({
      where: { userId: ownerId },
      orderBy: { createdAt: "desc" },
      take: 8,
    }),
  ]);

  return {
    totalPlayers,
    totalGroups,
    activeTournaments,
    completedTournaments,
    matchesPlayed,
    recentMatches,
    recentActivity,
  };
}
