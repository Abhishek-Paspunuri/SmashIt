import { NextResponse } from "next/server";
import { requireUser } from "@/lib/auth";
import { completePlayoffMatch } from "@/lib/services/playoffs";
import { z } from "zod";

const schema = z.object({
  winnerId: z.string(),
  homeScore: z.number().int().min(0),
  awayScore: z.number().int().min(0),
});

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    await requireUser();
    const { id } = await params;
    const body = await req.json();
    const parsed = schema.safeParse(body);
    if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
    await completePlayoffMatch(id, parsed.data.winnerId, parsed.data.homeScore, parsed.data.awayScore);
    return NextResponse.json({ data: { success: true } });
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 400 });
  }
}
