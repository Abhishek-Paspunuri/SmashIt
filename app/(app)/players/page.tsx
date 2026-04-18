import { requireUser } from "@/lib/auth";
import { getPlayers } from "@/lib/services/players";
import { PlayersClient } from "./players-client";

export const dynamic = "force-dynamic";

export default async function PlayersPage() {
  const user = await requireUser();
  const players = await getPlayers(user.id);
  return <PlayersClient initialPlayers={players} />;
}
