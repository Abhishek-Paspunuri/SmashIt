import { requireUser } from "@/lib/auth";
import { getDashboardStats } from "@/lib/services/analytics";
import { DashboardClient } from "./dashboard-client";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const user = await requireUser();
  const stats = await getDashboardStats(user.id);
  return <DashboardClient user={user} stats={stats} />;
}
