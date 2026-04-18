import { NextResponse } from "next/server";
import { requireUser } from "@/lib/auth";
import { getPlayer, updatePlayer, deletePlayer } from "@/lib/services/players";
import { z } from "zod";

const updateSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  email: z.string().email().optional().or(z.literal("")),
  phone: z.string().max(20).optional(),
  notes: z.string().max(500).optional(),
  status: z.enum(["ACTIVE", "INVITED", "INACTIVE"]).optional(),
});

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await requireUser();
    const { id } = await params;
    const player = await getPlayer(id, user.id);
    if (!player) return NextResponse.json({ error: "Not found" }, { status: 404 });
    return NextResponse.json({ data: player });
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
    await updatePlayer(id, user.id, {
      ...parsed.data,
      email: parsed.data.email || undefined,
    });
    const updated = await getPlayer(id, user.id);
    return NextResponse.json({ data: updated });
  } catch {
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await requireUser();
    const { id } = await params;
    await deletePlayer(id, user.id);
    return NextResponse.json({ data: { success: true } });
  } catch {
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
