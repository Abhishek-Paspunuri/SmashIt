import { prisma } from "@/lib/prisma";
import { getUser } from "@/lib/auth";
import { redirect } from "next/navigation";
import { JoinClient } from "./join-client";

export default async function JoinPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;

  const invite = await prisma.invitation.findUnique({
    where: { token },
    include: { invitedBy: { select: { name: true, email: true } } },
  });

  if (!invite || invite.status !== "PENDING" || invite.expiresAt < new Date()) {
    redirect("/login?error=invite_invalid");
  }

  const user = await getUser();

  // Not logged in → go login, then come back
  if (!user) {
    redirect(`/login?next=/join/${token}`);
  }

  // Already in same org
  const existing = await prisma.player.findFirst({
    where: { ownerId: invite.invitedById, userId: user.id },
  });

  return (
    <JoinClient
      token={token}
      orgOwnerName={invite.invitedBy.name ?? invite.invitedBy.email}
      invitedEmail={invite.email}
      alreadyMember={!!existing}
    />
  );
}
