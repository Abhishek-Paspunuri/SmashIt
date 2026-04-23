import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
import { z } from "zod";

const createSchema = z.object({
  email: z.string().email("Invalid email"),
});

// POST /api/invitations — create a new invite for a specific email
export async function POST(request: Request) {
  const user = await requireUser();

  let body: unknown;
  try { body = await request.json(); } catch { return NextResponse.json({ error: "Invalid JSON" }, { status: 400 }); }

  const parsed = createSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 422 });

  const { email } = parsed.data;

  // Check if an active invite already exists
  const existing = await prisma.invitation.findFirst({
    where: {
      invitedById: user.id,
      email,
      status: "PENDING",
      expiresAt: { gt: new Date() },
    },
  });
  if (existing) {
    return NextResponse.json({ data: { token: existing.token } });
  }

  const invite = await prisma.invitation.create({
    data: {
      email,
      invitedById: user.id,
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
    },
  });

  return NextResponse.json({ data: { token: invite.token } }, { status: 201 });
}

// GET /api/invitations — list invites I sent
export async function GET() {
  const user = await requireUser();

  const invitations = await prisma.invitation.findMany({
    where: { invitedById: user.id },
    orderBy: { createdAt: "desc" },
    take: 20,
  });

  return NextResponse.json({ data: invitations });
}
