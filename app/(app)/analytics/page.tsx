import { requireUser } from "@/lib/auth";
import { getAnalytics } from "@/lib/services/analytics";
import { AnalyticsClient } from "./analytics-client";

export const dynamic = "force-dynamic";

export default async function AnalyticsPage() {
  const user = await requireUser();
  const data = await getAnalytics(user.id);
  return <AnalyticsClient data={data} />;
}
