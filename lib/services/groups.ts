import { prisma } from "@/lib/prisma";

export async function getGroups(ownerId: string) {
  return prisma.group.findMany({
    where: { ownerId, deletedAt: null },
    include: {
      _count: { select: { members: true } },
    },
    orderBy: { createdAt: "desc" },
  });
}

export async function getGroup(id: string, ownerId: string) {
  return prisma.group.findFirst({
    where: { id, ownerId, deletedAt: null },
    include: {
      members: {
        include: { player: true },
        orderBy: { player: { name: "asc" } },
      },
    },
  });
}

export async function createGroup(
  ownerId: string,
  data: { name: string; description?: string; playerIds: string[] }
) {
  return prisma.group.create({
    data: {
      name: data.name,
      description: data.description,
      ownerId,
      members: {
        create: data.playerIds.map((playerId) => ({ playerId })),
      },
    },
    include: {
      members: { include: { player: true } },
      _count: { select: { members: true } },
    },
  });
}

export async function updateGroup(
  id: string,
  ownerId: string,
  data: { name?: string; description?: string }
) {
  return prisma.group.updateMany({
    where: { id, ownerId, deletedAt: null },
    data,
  });
}

export async function deleteGroup(id: string, ownerId: string) {
  return prisma.group.updateMany({
    where: { id, ownerId, deletedAt: null },
    data: { deletedAt: new Date() },
  });
}

export async function addGroupMembers(groupId: string, ownerId: string, playerIds: string[]) {
  // Verify group ownership
  const group = await prisma.group.findFirst({ where: { id: groupId, ownerId, deletedAt: null } });
  if (!group) throw new Error("Group not found");

  await prisma.groupMember.createMany({
    data: playerIds.map((playerId) => ({ groupId, playerId })),
    skipDuplicates: true,
  });
}

export async function removeGroupMember(groupId: string, ownerId: string, playerId: string) {
  const group = await prisma.group.findFirst({ where: { id: groupId, ownerId, deletedAt: null } });
  if (!group) throw new Error("Group not found");

  await prisma.groupMember.delete({
    where: { groupId_playerId: { groupId, playerId } },
  });
}
