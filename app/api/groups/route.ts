import { NextResponse } from "next/server";
import { requireUser } from "@/lib/auth";
import { getGroups, createGroup } from "@/lib/services/groups";
import { z } from "zod";

const createSchema = z.object({
  name: z.string().min(1).max(100),
  description: z.string().max(500).optional(),
  playerIds: z.array(z.string()).min(1),
});

export async function GET() {
  try {
    const user = await requireUser();
    const groups = await getGroups(user.id);
    return NextResponse.json({ data: groups });
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
    const group = await createGroup(user.id, parsed.data);
    return NextResponse.json({ data: group }, { status: 201 });
  } catch {
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
