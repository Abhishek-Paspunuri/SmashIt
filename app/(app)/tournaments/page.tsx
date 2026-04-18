import { requireUser } from "@/lib/auth";
import { getTournaments } from "@/lib/services/tournaments";
import { TournamentsClient } from "./tournaments-client";

export const dynamic = "force-dynamic";

export default async function TournamentsPage() {
  const user = await requireUser();
  const tournaments = await getTournaments(user.id);
  return <TournamentsClient initialTournaments={tournaments} />;
}
