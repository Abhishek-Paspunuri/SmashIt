import { prisma } from "@/lib/prisma";
import type { PlayerStatus } from "@prisma/client";

export async function getPlayers(ownerId: string, search?: string, status?: PlayerStatus) {
  return prisma.player.findMany({
    where: {
      ownerId,
      deletedAt: null,
      ...(search && {
        OR: [
          { name: { contains: search, mode: "insensitive" } },
          { email: { contains: search, mode: "insensitive" } },
        ],
      }),
      ...(status && { status }),
    },
    include: {
      groupMembers: { include: { group: true } },
    },
    orderBy: { name: "asc" },
  });
}

export async function getPlayer(id: string, ownerId: string) {
  return prisma.player.findFirst({
    where: { id, ownerId, deletedAt: null },
    include: {
      groupMembers: { include: { group: true } },
      teamMembers: {
        include: {
          team: {
            include: {
              tournament: true,
            },
          },
        },
      },
    },
  });
}

export async function createPlayer(
  ownerId: string,
  data: { name: string; email?: string; notes?: string; status?: PlayerStatus }
) {
  return prisma.player.create({
    data: {
      ...data,
      ownerId,
      status: data.status ?? "ACTIVE",
    },
  });
}

export async function updatePlayer(
  id: string,
  ownerId: string,
  data: { name?: string; email?: string; notes?: string; status?: PlayerStatus }
) {
  return prisma.player.updateMany({
    where: { id, ownerId, deletedAt: null },
    data,
  });
}

export async function deletePlayer(id: string, ownerId: string) {
  return prisma.player.updateMany({
    where: { id, ownerId, deletedAt: null },
    data: { deletedAt: new Date() },
  });
}
