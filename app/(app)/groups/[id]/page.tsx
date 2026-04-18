import { requireUser } from "@/lib/auth";
import { getGroup } from "@/lib/services/groups";
import { getPlayers } from "@/lib/services/players";
import { notFound } from "next/navigation";
import { GroupDetailClient } from "./group-detail-client";

export const dynamic = "force-dynamic";

export default async function GroupDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const user = await requireUser();
  const [group, allPlayers] = await Promise.all([
    getGroup(id, user.id),
    getPlayers(user.id),
  ]);
  if (!group) notFound();
  return <GroupDetailClient group={group} allPlayers={allPlayers} />;
}
