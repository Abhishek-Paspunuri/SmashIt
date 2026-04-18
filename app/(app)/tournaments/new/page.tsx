import { requireUser } from "@/lib/auth";
import { getPlayers } from "@/lib/services/players";
import { getGroups } from "@/lib/services/groups";
import { TournamentWizard } from "./tournament-wizard";

export const dynamic = "force-dynamic";

export default async function NewTournamentPage({
  searchParams,
}: {
  searchParams: Promise<{ groupId?: string }>;
}) {
  const { groupId } = await searchParams;
  const user = await requireUser();
  const [players, groups] = await Promise.all([
    getPlayers(user.id),
    getGroups(user.id),
  ]);
  return <TournamentWizard players={players} groups={groups} defaultGroupId={groupId} />;
}
