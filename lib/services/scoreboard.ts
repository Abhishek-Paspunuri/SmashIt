import { prisma } from "@/lib/prisma";
import { rankTeams } from "@/lib/utils/rankings";
import type { RankedTeam } from "@/lib/utils/rankings";

export async function getStandings(tournamentId: string): Promise<RankedTeam[]> {
  const teams = await prisma.team.findMany({
    where: { tournamentId },
    include: { members: { include: { player: true } } },
  });

  const matches = await prisma.match.findMany({
    where: { tournamentId, status: "COMPLETED" },
  });

  const stats = teams.map((team) => {
    const homeMatches = matches.filter((m) => m.homeTeamId === team.id);
    const awayMatches = matches.filter((m) => m.awayTeamId === team.id);

    const wins =
      homeMatches.filter((m) => m.winnerId === team.id).length +
      awayMatches.filter((m) => m.winnerId === team.id).length;

    const losses =
      homeMatches.filter((m) => m.winnerId !== team.id && m.winnerId !== null).length +
      awayMatches.filter((m) => m.winnerId !== team.id && m.winnerId !== null).length;

    const pointsFor =
      homeMatches.reduce((acc, m) => acc + (m.homeScore ?? 0), 0) +
      awayMatches.reduce((acc, m) => acc + (m.awayScore ?? 0), 0);

    const pointsAgainst =
      homeMatches.reduce((acc, m) => acc + (m.awayScore ?? 0), 0) +
      awayMatches.reduce((acc, m) => acc + (m.homeScore ?? 0), 0);

    return {
      teamId: team.id,
      name: team.name,
      played: wins + losses,
      wins,
      losses,
      pointsFor,
      pointsAgainst,
    };
  });

  return rankTeams(stats);
}
