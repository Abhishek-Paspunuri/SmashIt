import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { OrganisationClient } from "./organisation-client";

export const dynamic = "force-dynamic";

export default async function OrganisationPage() {
  const user = await requireUser();

  // Players in my org (my owned players)
  const players = await prisma.player.findMany({
    where: { ownerId: user.id, deletedAt: null },
    orderBy: { createdAt: "desc" },
    select: { id: true, name: true, email: true, avatarUrl: true, userId: true, status: true },
  });

  // Pending invitations I sent
  const invitations = await prisma.invitation.findMany({
    where: { invitedById: user.id },
    orderBy: { createdAt: "desc" },
    take: 10,
  });

  // Orgs I've joined as a linked player (bidirectional)
  const linkedPlayers = await prisma.player.findMany({
    where: { userId: user.id, deletedAt: null, NOT: { ownerId: user.id } },
    include: {
      owner: {
        select: {
          id: true, name: true, orgName: true, email: true, avatarUrl: true,
        },
      },
      groupMembers: {
        include: { group: { select: { id: true, name: true } } },
      },
    },
    orderBy: { createdAt: "asc" },
  });

  const joinedOrgs = linkedPlayers.map((p) => ({
    ownerId: p.owner.id,
    ownerName: p.owner.orgName ?? p.owner.name ?? p.owner.email.split("@")[0],
    ownerEmail: p.owner.email,
    ownerAvatar: p.owner.avatarUrl,
    groups: p.groupMembers.map((gm) => gm.group),
  }));

  return (
    <OrganisationClient
      user={{ id: user.id, name: user.name, email: user.email, avatarUrl: user.avatarUrl }}
      players={players}
      invitations={invitations}
      joinedOrgs={joinedOrgs}
    />
  );
}
