import { prisma } from "@/lib/prisma";
import { getStandings } from "@/lib/services/scoreboard";

interface MatchDraft {
  index: number;
  round: number;
  sequence: number;
  homeTeamId: string | null;
  homeSlot: string;
  homeFromIndex: number | null;
  homeFromResult: "winner" | "loser" | null;
  awayTeamId: string | null;
  awaySlot: string;
  awayFromIndex: number | null;
  awayFromResult: "winner" | "loser" | null;
}

function ordinal(n: number) {
  const s = ["th", "st", "nd", "rd"];
  const v = n % 100;
  return n + (s[(v - 20) % 10] || s[v] || s[0]);
}

export function buildBracketDrafts(n: number, teamIds: string[]): MatchDraft[] {
  const effective = n >= 6 ? 6 : n >= 4 ? 4 : n === 3 ? 3 : 2;
  const ids = teamIds.slice(0, effective);

  const draft: MatchDraft[] = [];

  if (effective === 2) {
    // Direct Grand Final
    draft.push({ index: 0, round: 3, sequence: 1, homeTeamId: ids[0], homeSlot: ordinal(1) + " Place", homeFromIndex: null, homeFromResult: null, awayTeamId: ids[1], awaySlot: ordinal(2) + " Place", awayFromIndex: null, awayFromResult: null });
  } else if (effective === 3) {
    // M0: T2 vs T3 (Eliminator — loser out, T1 has bye)
    draft.push({ index: 0, round: 1, sequence: 1, homeTeamId: ids[1], homeSlot: ordinal(2) + " Place", homeFromIndex: null, homeFromResult: null, awayTeamId: ids[2], awaySlot: ordinal(3) + " Place", awayFromIndex: null, awayFromResult: null });
    // M1: T1 vs W(M0) — Grand Final
    draft.push({ index: 1, round: 3, sequence: 1, homeTeamId: ids[0], homeSlot: ordinal(1) + " Place", homeFromIndex: null, homeFromResult: null, awayTeamId: null, awaySlot: "W: Eliminator", awayFromIndex: 0, awayFromResult: "winner" });
  } else if (effective === 4) {
    // M0: T1 vs T2
    draft.push({ index: 0, round: 1, sequence: 1, homeTeamId: ids[0], homeSlot: ordinal(1) + " Place", homeFromIndex: null, homeFromResult: null, awayTeamId: ids[1], awaySlot: ordinal(2) + " Place", awayFromIndex: null, awayFromResult: null });
    // M1: T3 vs T4
    draft.push({ index: 1, round: 1, sequence: 2, homeTeamId: ids[2], homeSlot: ordinal(3) + " Place", homeFromIndex: null, homeFromResult: null, awayTeamId: ids[3], awaySlot: ordinal(4) + " Place", awayFromIndex: null, awayFromResult: null });
    // M2: L(M0) vs W(M1)
    draft.push({ index: 2, round: 2, sequence: 1, homeTeamId: null, homeSlot: "L: 1st vs 2nd", homeFromIndex: 0, homeFromResult: "loser", awayTeamId: null, awaySlot: "W: 3rd vs 4th", awayFromIndex: 1, awayFromResult: "winner" });
    // M3: W(M0) vs W(M2) — Grand Final
    draft.push({ index: 3, round: 3, sequence: 1, homeTeamId: null, homeSlot: "W: 1st vs 2nd", homeFromIndex: 0, homeFromResult: "winner", awayTeamId: null, awaySlot: "W: Lower Final", awayFromIndex: 2, awayFromResult: "winner" });
  } else {
    // 6-team bracket
    // M0: T1 vs T2
    draft.push({ index: 0, round: 1, sequence: 1, homeTeamId: ids[0], homeSlot: ordinal(1) + " Place", homeFromIndex: null, homeFromResult: null, awayTeamId: ids[1], awaySlot: ordinal(2) + " Place", awayFromIndex: null, awayFromResult: null });
    // M1: T3 vs T4
    draft.push({ index: 1, round: 1, sequence: 2, homeTeamId: ids[2], homeSlot: ordinal(3) + " Place", homeFromIndex: null, homeFromResult: null, awayTeamId: ids[3], awaySlot: ordinal(4) + " Place", awayFromIndex: null, awayFromResult: null });
    // M2: T5 vs T6
    draft.push({ index: 2, round: 1, sequence: 3, homeTeamId: ids[4], homeSlot: ordinal(5) + " Place", homeFromIndex: null, homeFromResult: null, awayTeamId: ids[5], awaySlot: ordinal(6) + " Place", awayFromIndex: null, awayFromResult: null });
    // M3: L(M1) vs W(M2)
    draft.push({ index: 3, round: 2, sequence: 1, homeTeamId: null, homeSlot: "L: 3rd vs 4th", homeFromIndex: 1, homeFromResult: "loser", awayTeamId: null, awaySlot: "W: 5th vs 6th", awayFromIndex: 2, awayFromResult: "winner" });
    // M4: L(M0) vs W(M3)
    draft.push({ index: 4, round: 2, sequence: 2, homeTeamId: null, homeSlot: "L: 1st vs 2nd", homeFromIndex: 0, homeFromResult: "loser", awayTeamId: null, awaySlot: "W: Lower Semi", awayFromIndex: 3, awayFromResult: "winner" });
    // M5: W(M0) vs W(M4) — Grand Final
    draft.push({ index: 5, round: 3, sequence: 1, homeTeamId: null, homeSlot: "W: 1st vs 2nd", homeFromIndex: 0, homeFromResult: "winner", awayTeamId: null, awaySlot: "W: Lower Final", awayFromIndex: 4, awayFromResult: "winner" });
  }

  return draft;
}

export async function createPlayoffs(tournamentId: string, topN: number) {
  // Validate: all round-robin matches must be completed
  const incompleteCount = await prisma.match.count({
    where: { tournamentId, status: { not: "COMPLETED" } },
  });
  if (incompleteCount > 0) throw new Error("All matches must be completed first");

  // Check no playoffs already exist
  const existing = await prisma.playoffMatch.count({ where: { tournamentId } });
  if (existing > 0) throw new Error("Playoffs already created");

  // Get seeded teams
  const standings = await getStandings(tournamentId);
  const effective = topN >= 6 ? 6 : topN >= 4 ? 4 : topN === 3 ? 3 : 2;
  const seededIds = standings.slice(0, effective).map((s) => s.teamId);

  if (seededIds.length < effective) throw new Error("Not enough teams to generate this bracket");

  const drafts = buildBracketDrafts(topN, seededIds);

  // Create all matches first (without fromMatchId links)
  const created = await prisma.$transaction(
    drafts.map((d) =>
      prisma.playoffMatch.create({
        data: {
          tournamentId,
          round: d.round,
          sequence: d.sequence,
          homeTeamId: d.homeTeamId,
          awayTeamId: d.awayTeamId,
          homeSlot: d.homeSlot,
          awaySlot: d.awaySlot,
          status: "UPCOMING",
        },
      })
    )
  );

  // Now patch the fromMatchId links
  await prisma.$transaction(
    drafts
      .filter((d) => d.homeFromIndex !== null || d.awayFromIndex !== null)
      .map((d) =>
        prisma.playoffMatch.update({
          where: { id: created[d.index].id },
          data: {
            homeFromMatchId: d.homeFromIndex !== null ? created[d.homeFromIndex].id : undefined,
            homeFromResult: d.homeFromResult ?? undefined,
            awayFromMatchId: d.awayFromIndex !== null ? created[d.awayFromIndex].id : undefined,
            awayFromResult: d.awayFromResult ?? undefined,
          },
        })
      )
  );

  return getPlayoffs(tournamentId);
}

export async function getPlayoffs(tournamentId: string) {
  return prisma.playoffMatch.findMany({
    where: { tournamentId },
    include: {
      homeTeam: { include: { members: { include: { player: true } } } },
      awayTeam: { include: { members: { include: { player: true } } } },
    },
    orderBy: [{ round: "asc" }, { sequence: "asc" }],
  });
}

export async function completePlayoffMatch(
  matchId: string,
  winnerId: string,
  homeScore: number,
  awayScore: number
): Promise<{ tournamentCompleted: boolean; winnerTeamName: string | null }> {
  const match = await prisma.playoffMatch.findUnique({ where: { id: matchId } });
  if (!match) throw new Error("Match not found");
  if (!match.homeTeamId || !match.awayTeamId) throw new Error("Teams not yet determined");

  const loserId = match.homeTeamId === winnerId ? match.awayTeamId : match.homeTeamId;

  // Update match as completed
  await prisma.playoffMatch.update({
    where: { id: matchId },
    data: { winnerId, homeScore, awayScore, status: "COMPLETED", completedAt: new Date() },
  });

  // Resolve dependent matches
  const dependents = await prisma.playoffMatch.findMany({
    where: {
      OR: [{ homeFromMatchId: matchId }, { awayFromMatchId: matchId }],
    },
  });

  for (const dep of dependents) {
    const updates: { homeTeamId?: string; awayTeamId?: string } = {};
    if (dep.homeFromMatchId === matchId) {
      updates.homeTeamId = dep.homeFromResult === "winner" ? winnerId : loserId;
    }
    if (dep.awayFromMatchId === matchId) {
      updates.awayTeamId = dep.awayFromResult === "winner" ? winnerId : loserId;
    }
    await prisma.playoffMatch.update({ where: { id: dep.id }, data: updates });
  }

  // Auto-complete tournament if this was the Grand Final (round 3)
  if (match.round === 3) {
    const winnerTeam = await prisma.team.findUnique({
      where: { id: winnerId },
      select: { name: true },
    });
    const winnerTeamName = winnerTeam?.name ?? null;
    await prisma.tournament.update({
      where: { id: match.tournamentId },
      data: { status: "COMPLETED", winnerTeamName },
    });
    return { tournamentCompleted: true, winnerTeamName };
  }

  return { tournamentCompleted: false, winnerTeamName: null };
}
