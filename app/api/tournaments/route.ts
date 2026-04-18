import { NextResponse } from "next/server";
import { requireUser } from "@/lib/auth";
import { getTournaments, createTournament } from "@/lib/services/tournaments";
import { z } from "zod";

const teamSchema = z.object({
  name: z.string().min(1),
  playerIds: z.array(z.string()).min(1),
});

const createSchema = z.object({
  name: z.string().min(1).max(100),
  description: z.string().max(500).optional(),
  format: z.enum(["ROUND_ROBIN", "KNOCKOUT"]).default("ROUND_ROBIN"),
  teamSize: z.number().int().min(1).max(6).default(2),
  startDate: z.string().optional(),
  sourceGroupId: z.string().optional(),
  playerIds: z.array(z.string()).min(2),
  teams: z.array(teamSchema).min(2),
});

export async function GET() {
  try {
    const user = await requireUser();
    const tournaments = await getTournaments(user.id);
    return NextResponse.json({ data: tournaments });
  } catch {
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
    const tournament = await createTournament(user.id, {
      ...parsed.data,
      startDate: parsed.data.startDate ? new Date(parsed.data.startDate) : undefined,
    });
    return NextResponse.json({ data: tournament }, { status: 201 });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
