import { requireUser } from "@/lib/auth";
import { getPlayer } from "@/lib/services/players";
import { notFound } from "next/navigation";
import { Avatar } from "@/components/ui/avatar";
import { Card, CardHeader, CardTitle } from "@/components/ui/card";
import { PlayerStatusBadge, Badge } from "@/components/ui/badge";
import { formatDate } from "@/lib/utils";
import { Mail, FileText, Trophy, Users } from "lucide-react";
import Link from "next/link";

export const dynamic = "force-dynamic";

export default async function PlayerProfilePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const user = await requireUser();
  const player = await getPlayer(id, user.id);
  if (!player) notFound();

  const tournaments = player.teamMembers.map((tm) => tm.team.tournament);
  const uniqueTournaments = [...new Map(tournaments.map((t) => [t.id, t])).values()];

  return (
    <div className="max-w-2xl mx-auto px-4 py-5">
      {/* Back */}
      <Link href="/players" className="text-sm text-[var(--color-muted)] hover:text-orange-500 mb-4 inline-flex items-center gap-1">
        ← Back to Players
      </Link>

      {/* Profile header */}
      <div className="flex items-center gap-4 mb-6">
        <Avatar name={player.name} src={player.avatarUrl} size="xl" />
        <div>
          <h1 className="text-2xl font-bold text-[var(--color-foreground)]">{player.name}</h1>
          <div className="mt-1">
            <PlayerStatusBadge status={player.status} />
          </div>
          <p className="text-sm text-[var(--color-muted)] mt-1">
            Joined {formatDate(player.createdAt)}
          </p>
        </div>
      </div>

      <div className="space-y-4">
        {/* Contact info */}
        <Card>
          <CardHeader>
            <CardTitle>Contact</CardTitle>
          </CardHeader>
          <div className="space-y-2">
            {player.email ? (
              <div className="flex items-center gap-2 text-sm text-[var(--color-foreground)]">
                <Mail className="h-4 w-4 text-[var(--color-muted)]" />
                {player.email}
              </div>
            ) : (
              <p className="text-sm text-[var(--color-muted)]">No email on file</p>
            )}
            {player.notes && (
              <div className="flex items-start gap-2 text-sm text-[var(--color-foreground)] pt-1">
                <FileText className="h-4 w-4 text-[var(--color-muted)] mt-0.5 shrink-0" />
                {player.notes}
              </div>
            )}
          </div>
        </Card>

        {/* Groups */}
        <Card>
          <CardHeader>
            <CardTitle>
              <span className="flex items-center gap-2">
                <Users className="h-4 w-4 text-orange-500" />
                Groups ({player.groupMembers.length})
              </span>
            </CardTitle>
          </CardHeader>
          {player.groupMembers.length > 0 ? (
            <div className="flex flex-wrap gap-2">
              {player.groupMembers.map((gm) => (
                <Link key={gm.group.id} href={`/groups/${gm.group.id}`}>
                  <Badge variant="info" className="cursor-pointer hover:opacity-80">
                    {gm.group.name}
                  </Badge>
                </Link>
              ))}
            </div>
          ) : (
            <p className="text-sm text-[var(--color-muted)]">Not in any groups yet.</p>
          )}
        </Card>

        {/* Tournaments */}
        <Card>
          <CardHeader>
            <CardTitle>
              <span className="flex items-center gap-2">
                <Trophy className="h-4 w-4 text-orange-500" />
                Tournaments ({uniqueTournaments.length})
              </span>
            </CardTitle>
          </CardHeader>
          {uniqueTournaments.length > 0 ? (
            <div className="space-y-2">
              {uniqueTournaments.map((t) => (
                <Link key={t.id} href={`/tournaments/${t.id}`} className="flex items-center justify-between hover:bg-[var(--color-surface-3)] rounded-lg p-2 -mx-2 transition-colors">
                  <span className="text-sm font-medium text-[var(--color-foreground)]">{t.name}</span>
                  <Badge variant="muted" className="text-xs">{t.status}</Badge>
                </Link>
              ))}
            </div>
          ) : (
            <p className="text-sm text-[var(--color-muted)]">No tournaments yet.</p>
          )}
        </Card>
      </div>
    </div>
  );
}
