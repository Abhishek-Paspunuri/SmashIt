import { NextResponse } from "next/server";
import { requireUser } from "@/lib/auth";
import { createPlayoffs, getPlayoffs } from "@/lib/services/playoffs";
import { canManageTournament } from "@/lib/services/permissions";
import { z } from "zod";

const createSchema = z.object({ topN: z.number().int().min(4).max(6) });

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await requireUser();
    const { id } = await params;
    const access = await canManageTournament(id, user.id);
    if (!access) return NextResponse.json({ error: "Not found" }, { status: 404 });
    const playoffs = await getPlayoffs(id);
    return NextResponse.json({ data: playoffs });
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
}

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await requireUser();
    const { id } = await params;
    const access = await canManageTournament(id, user.id);
    if (!access) return NextResponse.json({ error: "Not found" }, { status: 404 });
    const body = await req.json();
    const parsed = createSchema.safeParse(body);
    if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
    const playoffs = await createPlayoffs(id, parsed.data.topN);
    return NextResponse.json({ data: playoffs });
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 400 });
  }
}
