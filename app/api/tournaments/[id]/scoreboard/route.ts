import { NextResponse } from "next/server";
import { requireUser } from "@/lib/auth";
import { getStandings } from "@/lib/services/scoreboard";
import { prisma } from "@/lib/prisma";

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await requireUser();
    const { id } = await params;

    // Verify ownership
    const tournament = await prisma.tournament.findFirst({
      where: { id, ownerId: user.id, deletedAt: null },
    });
    if (!tournament) return NextResponse.json({ error: "Not found" }, { status: 404 });

    const standings = await getStandings(id);
    return NextResponse.json({ data: standings });
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
}
