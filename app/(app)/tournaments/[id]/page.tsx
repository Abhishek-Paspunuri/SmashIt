import { requireUser } from "@/lib/auth";
import { getTournament } from "@/lib/services/tournaments";
import { getStandings } from "@/lib/services/scoreboard";
import { notFound } from "next/navigation";
import { TournamentDetailClient } from "./tournament-detail-client";

export const dynamic = "force-dynamic";

export default async function TournamentDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const user = await requireUser();
  const tournament = await getTournament(id, user.id);
  if (!tournament) notFound();

  const standings = await getStandings(id);

  return <TournamentDetailClient tournament={tournament} initialStandings={standings} />;
}
