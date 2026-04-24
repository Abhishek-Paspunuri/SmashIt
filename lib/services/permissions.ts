import { prisma } from "@/lib/prisma";

/**
 * Returns the tournament ownerId if the user can manage it, null otherwise.
 *
 * A user can manage a tournament if:
 * 1. They own it (ownerId === userId), OR
 * 2. They are a linked player in the tournament owner's org
 *    (Player where ownerId = tournament.ownerId, userId = userId, status = ACTIVE)
 */
export async function canManageTournament(
  tournamentId: string,
  userId: string,
): Promise<{ ownerId: string } | null> {
  const tournament = await prisma.tournament.findFirst({
    where: { id: tournamentId, deletedAt: null },
    select: { ownerId: true },
  });
  if (!tournament) return null;

  // Owner always has access
  if (tournament.ownerId === userId) return tournament;

  // Check if user is a linked player in the tournament's org
  const linked = await prisma.player.findFirst({
    where: { ownerId: tournament.ownerId, userId, status: "ACTIVE", deletedAt: null },
    select: { id: true },
  });

  return linked ? tournament : null;
}

/**
 * Returns all org ownerIds that the user has access to
 * (their own org + any orgs they've joined as a linked player).
 */
export async function getAccessibleOrgIds(userId: string): Promise<string[]> {
  const linkedOrgs = await prisma.player.findMany({
    where: { userId, status: "ACTIVE", deletedAt: null },
    select: { ownerId: true },
  });
  const orgIds = [...new Set([userId, ...linkedOrgs.map((p) => p.ownerId)])];
  return orgIds;
}
