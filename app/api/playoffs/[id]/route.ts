import { NextResponse } from "next/server";
import { requireUser } from "@/lib/auth";
import { completePlayoffMatch } from "@/lib/services/playoffs";
import { canManageTournament } from "@/lib/services/permissions";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const schema = z.object({
  winnerId: z.string(),
  homeScore: z.number().int().min(0),
  awayScore: z.number().int().min(0),
});

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await requireUser();
    const { id } = await params;

    // Verify user can manage this playoff match's tournament
    const playoffMatch = await prisma.playoffMatch.findUnique({
      where: { id },
      select: { tournamentId: true },
    });
    if (!playoffMatch) return NextResponse.json({ error: "Not found" }, { status: 404 });

    const access = await canManageTournament(playoffMatch.tournamentId, user.id);
    if (!access) return NextResponse.json({ error: "Not found" }, { status: 404 });

    const body = await req.json();
    const parsed = schema.safeParse(body);
    if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
    await completePlayoffMatch(id, parsed.data.winnerId, parsed.data.homeScore, parsed.data.awayScore);
    return NextResponse.json({ data: { success: true } });
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 400 });
  }
}
