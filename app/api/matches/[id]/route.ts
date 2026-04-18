import { NextResponse } from "next/server";
import { requireUser } from "@/lib/auth";
import { getMatch, startMatch, completeMatch } from "@/lib/services/matches";
import { z } from "zod";

const completeSchema = z.object({
  action: z.literal("complete"),
  winnerId: z.string(),
  homeScore: z.number().int().min(0).max(30),
  awayScore: z.number().int().min(0).max(30),
});

const startSchema = z.object({
  action: z.literal("start"),
});

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await requireUser();
    const { id } = await params;
    const match = await getMatch(id);
    if (!match || match.tournament.ownerId !== user.id) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }
    return NextResponse.json({ data: match });
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
}

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await requireUser();
    const { id } = await params;
    const body = await request.json();

    if (body.action === "start") {
      const match = await startMatch(id, user.id);
      return NextResponse.json({ data: match });
    }

    if (body.action === "complete") {
      const parsed = completeSchema.safeParse(body);
      if (!parsed.success) {
        return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
      }
      const match = await completeMatch(id, user.id, {
        winnerId: parsed.data.winnerId,
        homeScore: parsed.data.homeScore,
        awayScore: parsed.data.awayScore,
      });
      return NextResponse.json({ data: match });
    }

    return NextResponse.json({ error: "Invalid action" }, { status: 400 });
  } catch (error) {
    return NextResponse.json({ error: (error as Error).message }, { status: 400 });
  }
}
