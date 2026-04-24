import { prisma } from "@/lib/prisma";
import { generateRoundRobin } from "@/lib/utils/round-robin";
import { getAccessibleOrgIds, canManageTournament } from "@/lib/services/permissions";
import type { TournamentStatus, TournamentFormat } from "@prisma/client";

export async function getTournaments(userId: string) {
  const orgIds = await getAccessibleOrgIds(userId);
  return prisma.tournament.findMany({
    where: { ownerId: { in: orgIds }, deletedAt: null },
    include: {
      _count: { select: { matches: true, teams: true, participants: true } },
      sourceGroup: true,
      owner: { select: { id: true, name: true, orgName: true, email: true } },
    },
    orderBy: { createdAt: "desc" },
  });
}

export async function getTournament(id: string, userId: string) {
  const access = await canManageTournament(id, userId);
  if (!access) return null;

  return prisma.tournament.findFirst({
    where: { id, deletedAt: null },
    include: {
      owner: { select: { id: true, name: true, orgName: true, email: true } },
      participants: { include: { player: true } },
      teams: {
        include: {
          members: { include: { player: true } },
        },
        orderBy: { name: "asc" },
      },
      matches: {
        include: {
          homeTeam: { include: { members: { include: { player: true } } } },
          awayTeam: { include: { members: { include: { player: true } } } },
        },
        orderBy: { sequence: "asc" },
      },
    },
  });
}

export interface CreateTournamentInput {
  name: string;
  description?: string;
  format: TournamentFormat;
  teamSize: number;
  startDate?: Date;
  sourceGroupId?: string;
  playerIds: string[];
  teams: { name: string; playerIds: string[] }[];
}

export async function createTournament(ownerId: string, input: CreateTournamentInput) {
  return prisma.$transaction(async (tx) => {
    const tournament = await tx.tournament.create({
      data: {
        name: input.name,
        description: input.description,
        format: input.format,
        teamSize: input.teamSize,
        startDate: input.startDate,
        sourceGroupId: input.sourceGroupId,
        ownerId,
        status: "DRAFT",
        participants: {
          create: input.playerIds.map((playerId) => ({ playerId })),
        },
        teams: {
          create: input.teams.map((team) => ({
            name: team.name,
            members: {
              create: team.playerIds.map((playerId) => ({ playerId })),
            },
          })),
        },
      },
      include: {
        teams: true,
      },
    });

    return tournament;
  });
}

export async function updateTournamentStatus(
  id: string,
  userId: string,
  status: TournamentStatus
) {
  const access = await canManageTournament(id, userId);
  if (!access) throw new Error("Tournament not found");

  const tournament = await prisma.tournament.findFirst({
    where: { id, deletedAt: null },
    include: { teams: true, matches: true },
  });
  if (!tournament) throw new Error("Tournament not found");

  // When transitioning to LIVE, generate round-robin matches if none exist
  if (status === "LIVE" && tournament.matches.length === 0 && tournament.teams.length >= 2) {
    const pairs = generateRoundRobin(tournament.teams.map((t) => t.id));
    await prisma.$transaction([
      prisma.tournament.update({ where: { id }, data: { status } }),
      prisma.match.createMany({
        data: pairs.map((p) => ({
          tournamentId: id,
          homeTeamId: p.homeTeamId,
          awayTeamId: p.awayTeamId,
          round: p.round,
          sequence: p.sequence,
          status: "UPCOMING",
        })),
      }),
    ]);
  } else {
    await prisma.tournament.update({ where: { id }, data: { status } });
  }

  return prisma.tournament.findUnique({ where: { id } });
}

export async function deleteTournament(id: string, userId: string) {
  // Only the actual owner can delete a tournament
  const tournament = await prisma.tournament.findFirst({
    where: { id, ownerId: userId, deletedAt: null },
  });
  if (!tournament) throw new Error("Tournament not found or only the owner can delete");
  return prisma.tournament.update({
    where: { id },
    data: { deletedAt: new Date() },
  });
}
