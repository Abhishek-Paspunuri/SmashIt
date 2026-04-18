import { NextResponse } from "next/server";
import { requireUser } from "@/lib/auth";
import { getGroup, updateGroup, deleteGroup, addGroupMembers, removeGroupMember } from "@/lib/services/groups";
import { z } from "zod";

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await requireUser();
    const { id } = await params;
    const group = await getGroup(id, user.id);
    if (!group) return NextResponse.json({ error: "Not found" }, { status: 404 });
    return NextResponse.json({ data: group });
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
}

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await requireUser();
    const { id } = await params;
    const body = await request.json();

    // Handle member operations
    if (body.action === "add_members") {
      await addGroupMembers(id, user.id, body.playerIds);
      return NextResponse.json({ data: { success: true } });
    }
    if (body.action === "remove_member") {
      await removeGroupMember(id, user.id, body.playerId);
      return NextResponse.json({ data: { success: true } });
    }

    // Regular update
    await updateGroup(id, user.id, { name: body.name, description: body.description });
    return NextResponse.json({ data: { success: true } });
  } catch {
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await requireUser();
    const { id } = await params;
    await deleteGroup(id, user.id);
    return NextResponse.json({ data: { success: true } });
  } catch {
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
