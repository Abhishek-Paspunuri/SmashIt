import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

// GET /api/invitations/[token] — look up an invite
export async function GET(_req: Request, { params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;

  const invite = await prisma.invitation.findUnique({
    where: { token },
    include: { invitedBy: { select: { name: true, email: true } } },
  });

  if (!invite) return NextResponse.json({ error: "Invalid invite" }, { status: 404 });
  if (invite.status !== "PENDING" || invite.expiresAt < new Date()) {
    return NextResponse.json({ error: "Invite expired or already used" }, { status: 410 });
  }

  return NextResponse.json({ data: invite });
}

// POST /api/invitations/[token] — accept an invite
export async function POST(_req: Request, { params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const user = await requireUser();

  const invite = await prisma.invitation.findUnique({
    where: { token },
    include: { invitedBy: true },
  });

  if (!invite) return NextResponse.json({ error: "Invalid invite" }, { status: 404 });
  if (invite.status !== "PENDING" || invite.expiresAt < new Date()) {
    return NextResponse.json({ error: "Invite expired or already used" }, { status: 410 });
  }
  if (invite.invitedById === user.id) {
    return NextResponse.json({ error: "Cannot accept your own invite" }, { status: 400 });
  }

  // Check if this user is already a player in the inviter's org
  const existingPlayer = await prisma.player.findFirst({
    where: { ownerId: invite.invitedById, userId: user.id },
  });

  if (!existingPlayer) {
    // Add them as a player in the inviter's org
    await prisma.player.create({
      data: {
        name: user.name ?? user.email.split("@")[0],
        email: user.email,
        ownerId: invite.invitedById,
        userId: user.id,
        status: "ACTIVE",
      },
    });
  }

  // Mark invitation as accepted
  await prisma.invitation.update({
    where: { token },
    data: {
      status: "ACCEPTED",
      acceptedAt: new Date(),
    },
  });

  return NextResponse.json({ data: { orgOwnerId: invite.invitedById, orgOwnerName: invite.invitedBy.name } });
}
