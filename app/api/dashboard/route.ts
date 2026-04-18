import { NextResponse } from "next/server";
import { requireUser } from "@/lib/auth";
import { getDashboardStats } from "@/lib/services/analytics";

export async function GET() {
  try {
    const user = await requireUser();
    const data = await getDashboardStats(user.id);
    return NextResponse.json({ data });
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
}
