import { NextResponse } from "next/server";
import { requireUser } from "@/lib/auth";
import { getPlayers, createPlayer } from "@/lib/services/players";
import { z } from "zod";
import type { PlayerStatus } from "@prisma/client";

const createSchema = z.object({
  name: z.string().min(1).max(100),
  email: z.string().email().optional().or(z.literal("")),
  notes: z.string().max(500).optional(),
  status: z.enum(["ACTIVE", "INVITED", "INACTIVE"]).optional(),
});

export async function GET(request: Request) {
  try {
    const user = await requireUser();
    const { searchParams } = new URL(request.url);
    const search = searchParams.get("search") ?? undefined;
    const status = searchParams.get("status") as PlayerStatus | null;

    const players = await getPlayers(user.id, search, status ?? undefined);
    return NextResponse.json({ data: players });
  } catch (error) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
}

export async function POST(request: Request) {
  try {
    const user = await requireUser();
    const body = await request.json();
    const parsed = createSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
    }

    const player = await createPlayer(user.id, {
      ...parsed.data,
      email: parsed.data.email || undefined,
    });
    return NextResponse.json({ data: player }, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
