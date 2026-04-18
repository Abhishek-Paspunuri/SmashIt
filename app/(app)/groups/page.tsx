import { requireUser } from "@/lib/auth";
import { getGroups } from "@/lib/services/groups";
import { getPlayers } from "@/lib/services/players";
import { GroupsClient } from "./groups-client";

export const dynamic = "force-dynamic";

export default async function GroupsPage() {
  const user = await requireUser();
  const [groups, players] = await Promise.all([
    getGroups(user.id),
    getPlayers(user.id),
  ]);
  return <GroupsClient initialGroups={groups} allPlayers={players} />;
}
