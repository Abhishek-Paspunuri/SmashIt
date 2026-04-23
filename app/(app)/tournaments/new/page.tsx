import { requireUser } from "@/lib/auth";
import { getPlayers } from "@/lib/services/players";
import { getGroups, getGroup } from "@/lib/services/groups";
import { TournamentWizard } from "./tournament-wizard";

export const dynamic = "force-dynamic";

export default async function NewTournamentPage({
  searchParams,
}: {
  searchParams: Promise<{ groupId?: string }>;
}) {
  const { groupId } = await searchParams;
  const user = await requireUser();
  const [players, groups, groupDetail] = await Promise.all([
    getPlayers(user.id),
    getGroups(user.id),
    groupId ? getGroup(groupId, user.id) : Promise.resolve(null),
  ]);

  const defaultPlayerIds = groupDetail
    ? groupDetail.members.map((m) => m.player.id)
    : undefined;

  return (
    <TournamentWizard
      players={players}
      groups={groups}
      defaultGroupId={groupId}
      defaultPlayerIds={defaultPlayerIds}
    />
  );
}
