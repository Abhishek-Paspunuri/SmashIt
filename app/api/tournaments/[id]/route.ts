import { NextResponse } from "next/server";
import { requireUser } from "@/lib/auth";
import { getTournament, updateTournamentStatus, deleteTournament } from "@/lib/services/tournaments";
import { z } from "zod";

const updateSchema = z.object({
  status: z.enum(["DRAFT", "SCHEDULED", "LIVE", "COMPLETED", "ARCHIVED"]).optional(),
});

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await requireUser();
    const { id } = await params;
    const tournament = await getTournament(id, user.id);
    if (!tournament) return NextResponse.json({ error: "Not found" }, { status: 404 });
    return NextResponse.json({ data: tournament });
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
}

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await requireUser();
    const { id } = await params;
    const body = await request.json();
    const parsed = updateSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
    }
    if (parsed.data.status) {
      await updateTournamentStatus(id, user.id, parsed.data.status);
    }
    return NextResponse.json({ data: { success: true } });
  } catch (error) {
    return NextResponse.json({ error: (error as Error).message }, { status: 400 });
  }
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await requireUser();
    const { id } = await params;
    await deleteTournament(id, user.id);
    return NextResponse.json({ data: { success: true } });
  } catch {
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
