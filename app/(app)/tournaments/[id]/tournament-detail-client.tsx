"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge, TournamentStatusBadge, MatchStatusBadge } from "@/components/ui/badge";
import { Avatar } from "@/components/ui/avatar";
import { useToast } from "@/components/ui/toast";
import { Modal } from "@/components/ui/modal";
import { ArrowLeft, Play, CheckCircle2, Users, Trophy, Swords, Medal } from "lucide-react";
import type { TournamentDetail, RankedTeam, MatchWithTeams, TeamWithMembers } from "@/types";
import Link from "next/link";
import { cn } from "@/lib/utils";

type Tab = "matches" | "scoreboard" | "teams";

interface TournamentDetailClientProps {
  tournament: TournamentDetail;
  initialStandings: RankedTeam[];
}

export function TournamentDetailClient({ tournament: initial, initialStandings }: TournamentDetailClientProps) {
  const router = useRouter();
  const { toast } = useToast();
  const [tournament, setTournament] = useState(initial);
  const [standings, setStandings] = useState(initialStandings);
  const [tab, setTab] = useState<Tab>("matches");
  const [statusLoading, setStatusLoading] = useState(false);
  const [completeMatch, setCompleteMatch] = useState<MatchWithTeams | null>(null);

  async function handleStatusChange(status: string) {
    setStatusLoading(true);
    try {
      const res = await fetch(`/api/tournaments/${tournament.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      if (!res.ok) throw new Error("Failed");
      router.refresh();
      toast(`Tournament ${status === "LIVE" ? "started" : "updated"}!`, "success");
    } catch {
      toast("Failed to update status", "error");
    } finally {
      setStatusLoading(false);
    }
  }

  async function handleStartMatch(matchId: string) {
    try {
      const res = await fetch(`/api/matches/${matchId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "start" }),
      });
      if (!res.ok) throw new Error("Failed");
      setTournament((prev) => ({
        ...prev,
        matches: prev.matches.map((m) =>
          m.id === matchId ? { ...m, status: "LIVE" as const } : m
        ),
      }));
      toast("Match started!", "success");
    } catch {
      toast("Failed to start match", "error");
    }
  }

  async function handleCompleteMatch(matchId: string, winnerId: string, homeScore: number, awayScore: number) {
    try {
      const res = await fetch(`/api/matches/${matchId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "complete", winnerId, homeScore, awayScore }),
      });
      if (!res.ok) throw new Error("Failed");

      setTournament((prev) => ({
        ...prev,
        matches: prev.matches.map((m) =>
          m.id === matchId
            ? { ...m, status: "COMPLETED" as const, winnerId, homeScore, awayScore }
            : m
        ),
      }));

      // Refresh standings
      const sRes = await fetch(`/api/tournaments/${tournament.id}/scoreboard`);
      if (sRes.ok) {
        const sJson = await sRes.json();
        setStandings(sJson.data);
      }

      setCompleteMatch(null);
      toast("Match completed!", "success");
    } catch {
      toast("Failed to complete match", "error");
    }
  }

  const upcoming = tournament.matches.filter((m) => m.status === "UPCOMING");
  const live = tournament.matches.filter((m) => m.status === "LIVE");
  const completed = tournament.matches.filter((m) => m.status === "COMPLETED");

  return (
    <div className="max-w-2xl mx-auto px-4 py-5">
      {/* Back */}
      <Link href="/tournaments" className="inline-flex items-center gap-1 text-sm text-[var(--color-muted)] hover:text-orange-500 mb-4">
        <ArrowLeft className="h-3.5 w-3.5" /> Tournaments
      </Link>

      {/* Header */}
      <div className="flex items-start justify-between gap-3 mb-4">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <h1 className="text-xl font-bold text-[var(--color-foreground)] truncate">{tournament.name}</h1>
            <TournamentStatusBadge status={tournament.status} />
          </div>
          {tournament.description && (
            <p className="text-sm text-[var(--color-muted)] mt-0.5">{tournament.description}</p>
          )}
          <div className="flex gap-3 mt-2 text-xs text-[var(--color-muted)]">
            <span>{tournament.teams.length} teams</span>
            <span>{tournament.matches.length} matches</span>
            <span>{tournament.participants.length} players</span>
          </div>
        </div>
        {/* Status actions */}
        {tournament.status === "DRAFT" && (
          <Button size="sm" onClick={() => handleStatusChange("LIVE")} loading={statusLoading}>
            <Play className="h-3.5 w-3.5" />
            Start
          </Button>
        )}
        {tournament.status === "LIVE" && (
          <Button size="sm" variant="secondary" onClick={() => handleStatusChange("COMPLETED")} loading={statusLoading}>
            <CheckCircle2 className="h-3.5 w-3.5" />
            Finish
          </Button>
        )}
      </div>

      {/* Tabs */}
      <div className="flex border-b border-[var(--color-border)] mb-4">
        {(["matches", "scoreboard", "teams"] as Tab[]).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={cn(
              "flex-1 py-2.5 text-sm font-medium capitalize transition-colors border-b-2 -mb-px",
              tab === t
                ? "border-orange-500 text-orange-500"
                : "border-transparent text-[var(--color-muted)] hover:text-[var(--color-foreground)]"
            )}
          >
            {t}
          </button>
        ))}
      </div>

      {/* Tab: Matches */}
      {tab === "matches" && (
        <div className="space-y-4">
          {tournament.matches.length === 0 && (
            <div className="text-center py-12 text-[var(--color-muted)] text-sm">
              {tournament.status === "DRAFT"
                ? "Start the tournament to generate matches."
                : "No matches scheduled yet."}
            </div>
          )}

          {live.length > 0 && (
            <Section title="Live" accent="orange">
              {live.map((m) => (
                <MatchCard
                  key={m.id}
                  match={m}
                  onComplete={() => setCompleteMatch(m)}
                />
              ))}
            </Section>
          )}

          {upcoming.length > 0 && (
            <Section title="Upcoming">
              {upcoming.map((m) => (
                <MatchCard key={m.id} match={m} onStart={() => handleStartMatch(m.id)} />
              ))}
            </Section>
          )}

          {completed.length > 0 && (
            <Section title="Completed">
              {completed.map((m) => (
                <MatchCard key={m.id} match={m} />
              ))}
            </Section>
          )}
        </div>
      )}

      {/* Tab: Scoreboard */}
      {tab === "scoreboard" && (
        <ScoreboardTab standings={standings} />
      )}

      {/* Tab: Teams */}
      {tab === "teams" && (
        <TeamsTab teams={tournament.teams} />
      )}

      {/* Complete Match Modal */}
      {completeMatch && (
        <CompleteMatchModal
          match={completeMatch}
          onClose={() => setCompleteMatch(null)}
          onComplete={handleCompleteMatch}
        />
      )}
    </div>
  );
}

// ── Section ──────────────────────────────────────────────────────────────────

function Section({ title, accent, children }: { title: string; accent?: string; children: React.ReactNode }) {
  return (
    <div>
      <h3 className={cn("text-xs font-semibold uppercase tracking-wide mb-2", accent === "orange" ? "text-orange-500" : "text-[var(--color-muted)]")}>
        {title}
      </h3>
      <div className="space-y-2">{children}</div>
    </div>
  );
}

// ── Match Card ───────────────────────────────────────────────────────────────

function MatchCard({ match, onStart, onComplete }: {
  match: MatchWithTeams;
  onStart?: () => void;
  onComplete?: () => void;
}) {
  const isLive = match.status === "LIVE";
  const isDone = match.status === "COMPLETED";

  return (
    <Card padded={false} className={cn("p-3", isLive && "border-orange-500/50 bg-orange-50/50 dark:bg-orange-900/10")}>
      <div className="flex items-center gap-2">
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-2">
            {/* Home */}
            <div className="flex-1 text-right">
              <p className="text-sm font-semibold text-[var(--color-foreground)] truncate">
                {match.homeTeam.name}
              </p>
              <div className="flex justify-end gap-1 mt-0.5">
                {match.homeTeam.members.slice(0, 2).map((m) => (
                  <span key={m.player.id} className="text-[10px] text-[var(--color-muted)] truncate max-w-[4rem]">
                    {m.player.name.split(" ")[0]}
                  </span>
                ))}
              </div>
            </div>

            {/* Score */}
            <div className="flex items-center gap-2 shrink-0">
              {isDone ? (
                <>
                  <span className={cn("text-lg font-bold w-6 text-center", match.winnerId === match.homeTeamId ? "text-orange-500" : "text-[var(--color-muted)]")}>
                    {match.homeScore}
                  </span>
                  <span className="text-[var(--color-muted)] text-xs">—</span>
                  <span className={cn("text-lg font-bold w-6 text-center", match.winnerId === match.awayTeamId ? "text-orange-500" : "text-[var(--color-muted)]")}>
                    {match.awayScore}
                  </span>
                </>
              ) : (
                <span className="text-xs text-[var(--color-muted)] px-2">vs</span>
              )}
            </div>

            {/* Away */}
            <div className="flex-1">
              <p className="text-sm font-semibold text-[var(--color-foreground)] truncate">
                {match.awayTeam.name}
              </p>
              <div className="flex gap-1 mt-0.5">
                {match.awayTeam.members.slice(0, 2).map((m) => (
                  <span key={m.player.id} className="text-[10px] text-[var(--color-muted)] truncate max-w-[4rem]">
                    {m.player.name.split(" ")[0]}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Actions */}
        {onStart && (
          <Button size="sm" variant="secondary" onClick={onStart}>
            <Play className="h-3.5 w-3.5" />
          </Button>
        )}
        {onComplete && (
          <Button size="sm" onClick={onComplete}>
            Done
          </Button>
        )}
      </div>

      {isLive && (
        <div className="flex items-center gap-1 mt-1">
          <div className="h-1.5 w-1.5 rounded-full bg-orange-500 animate-pulse" />
          <span className="text-[10px] text-orange-500 font-semibold">LIVE</span>
        </div>
      )}
    </Card>
  );
}

// ── Complete Match Modal ──────────────────────────────────────────────────────

function CompleteMatchModal({ match, onClose, onComplete }: {
  match: MatchWithTeams;
  onClose: () => void;
  onComplete: (matchId: string, winnerId: string, homeScore: number, awayScore: number) => void;
}) {
  const [winnerId, setWinnerId] = useState<string>("");
  const [loserScore, setLoserScore] = useState(15);
  const [loading, setLoading] = useState(false);

  const homeIsWinner = winnerId === match.homeTeamId;
  const awayIsWinner = winnerId === match.awayTeamId;
  const homeScore = homeIsWinner ? 21 : awayIsWinner ? loserScore : 0;
  const awayScore = awayIsWinner ? 21 : homeIsWinner ? loserScore : 0;

  async function handleSubmit() {
    if (!winnerId) return;
    setLoading(true);
    await onComplete(match.id, winnerId, homeScore, awayScore);
    setLoading(false);
  }

  return (
    <Modal open onClose={onClose} title="Complete Match">
      <div className="space-y-4">
        <p className="text-sm text-[var(--color-muted)]">Select the winning team.</p>

        {/* Team selector */}
        <div className="grid grid-cols-2 gap-3">
          {[
            { team: match.homeTeam, id: match.homeTeamId },
            { team: match.awayTeam, id: match.awayTeamId },
          ].map(({ team, id }) => (
            <button
              key={id}
              onClick={() => setWinnerId(id)}
              className={cn(
                "rounded-xl p-3 border-2 transition-all text-left",
                winnerId === id
                  ? "border-orange-500 bg-orange-50 dark:bg-orange-900/20"
                  : "border-[var(--color-border)] hover:border-orange-300"
              )}
            >
              <div className="flex items-center gap-1.5 flex-wrap">
                {team.members.map((m) => (
                  <Avatar key={m.player.id} name={m.player.name} src={m.player.avatarUrl} size="xs" />
                ))}
              </div>
              <p className="text-sm font-semibold text-[var(--color-foreground)] mt-2">{team.name}</p>
              {winnerId === id && (
                <div className="flex items-center gap-1 mt-1">
                  <Trophy className="h-3 w-3 text-orange-500" />
                  <span className="text-xs text-orange-500 font-semibold">Winner</span>
                </div>
              )}
            </button>
          ))}
        </div>

        {/* Loser score */}
        {winnerId && (
          <div>
            <label className="text-sm font-medium text-[var(--color-foreground)] block mb-2">
              Losing team&apos;s score (0–20)
            </label>
            <ScoreScroller value={loserScore} onChange={setLoserScore} min={0} max={20} />
          </div>
        )}

        {/* Preview */}
        {winnerId && (
          <div className="flex items-center justify-center gap-4 py-2 rounded-xl bg-[var(--color-surface-3)]">
            <div className="text-center">
              <p className="text-xs text-[var(--color-muted)] truncate">{match.homeTeam.name}</p>
              <p className={cn("text-2xl font-bold", homeIsWinner ? "text-orange-500" : "text-[var(--color-foreground)]")}>
                {homeScore}
              </p>
            </div>
            <span className="text-[var(--color-muted)]">—</span>
            <div className="text-center">
              <p className="text-xs text-[var(--color-muted)] truncate">{match.awayTeam.name}</p>
              <p className={cn("text-2xl font-bold", awayIsWinner ? "text-orange-500" : "text-[var(--color-foreground)]")}>
                {awayScore}
              </p>
            </div>
          </div>
        )}

        <Button
          className="w-full"
          onClick={handleSubmit}
          loading={loading}
          disabled={!winnerId}
        >
          Save Result
        </Button>
      </div>
    </Modal>
  );
}

// ── Score Scroller ────────────────────────────────────────────────────────────

function ScoreScroller({ value, onChange, min, max }: {
  value: number; onChange: (v: number) => void; min: number; max: number;
}) {
  const items = Array.from({ length: max - min + 1 }, (_, i) => i + min);

  return (
    <div className="relative h-32 overflow-hidden rounded-xl border border-[var(--color-border)]">
      {/* Highlight band */}
      <div className="absolute inset-x-0 top-1/2 -translate-y-1/2 h-10 bg-orange-500/10 dark:bg-orange-500/20 border-y border-orange-500/30 pointer-events-none z-10" />
      <div
        className="h-full overflow-y-auto snap-y snap-mandatory"
        style={{ scrollbarWidth: "none" }}
        onScroll={(e) => {
          const el = e.currentTarget;
          const itemHeight = el.scrollHeight / items.length;
          const index = Math.round(el.scrollTop / itemHeight);
          onChange(items[Math.min(Math.max(index, 0), items.length - 1)]);
        }}
      >
        <div className="py-11">
          {items.map((n) => (
            <div
              key={n}
              className={cn(
                "h-10 flex items-center justify-center text-xl font-bold snap-center cursor-pointer transition-colors",
                n === value ? "text-orange-500" : "text-[var(--color-muted)]"
              )}
              onClick={() => onChange(n)}
            >
              {n}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ── Scoreboard Tab ────────────────────────────────────────────────────────────

function ScoreboardTab({ standings }: { standings: RankedTeam[] }) {
  if (standings.length === 0) {
    return (
      <div className="text-center py-12 text-[var(--color-muted)] text-sm">
        No matches completed yet. Standings will appear here.
      </div>
    );
  }

  return (
    <div className="overflow-x-auto -mx-4">
      <table className="w-full min-w-[500px] text-sm">
        <thead>
          <tr className="border-b border-[var(--color-border)]">
            <th className="text-left pl-4 py-2 text-xs font-semibold text-[var(--color-muted)] w-8">#</th>
            <th className="text-left py-2 text-xs font-semibold text-[var(--color-muted)]">Team</th>
            <th className="text-center py-2 text-xs font-semibold text-[var(--color-muted)] w-10">P</th>
            <th className="text-center py-2 text-xs font-semibold text-[var(--color-muted)] w-10">W</th>
            <th className="text-center py-2 text-xs font-semibold text-[var(--color-muted)] w-10">L</th>
            <th className="text-center py-2 text-xs font-semibold text-[var(--color-muted)] w-12">PF</th>
            <th className="text-center py-2 text-xs font-semibold text-[var(--color-muted)] w-12">PA</th>
            <th className="text-center pr-4 py-2 text-xs font-semibold text-[var(--color-muted)] w-12">+/-</th>
          </tr>
        </thead>
        <tbody>
          {standings.map((team, i) => (
            <tr
              key={team.teamId}
              className={cn(
                "border-b border-[var(--color-border)] transition-colors",
                i === 0 && "bg-orange-50/50 dark:bg-orange-900/10"
              )}
            >
              <td className="pl-4 py-3 text-sm font-bold text-[var(--color-muted)]">
                {i === 0 ? <Medal className="h-4 w-4 text-orange-500 inline" /> : team.rank}
              </td>
              <td className="py-3 font-semibold text-[var(--color-foreground)]">{team.name}</td>
              <td className="text-center py-3 text-[var(--color-muted)]">{team.played}</td>
              <td className="text-center py-3 font-semibold text-green-600 dark:text-green-400">{team.wins}</td>
              <td className="text-center py-3 text-[var(--color-muted)]">{team.losses}</td>
              <td className="text-center py-3 text-[var(--color-muted)]">{team.pointsFor}</td>
              <td className="text-center py-3 text-[var(--color-muted)]">{team.pointsAgainst}</td>
              <td className={cn("text-center pr-4 py-3 font-medium", team.pointDiff > 0 ? "text-green-600 dark:text-green-400" : team.pointDiff < 0 ? "text-red-500" : "text-[var(--color-muted)]")}>
                {team.pointDiff > 0 ? `+${team.pointDiff}` : team.pointDiff}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

// ── Teams Tab ────────────────────────────────────────────────────────────────

function TeamsTab({ teams }: { teams: TeamWithMembers[] }) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
      {teams.map((team) => (
        <Card key={team.id}>
          <div className="flex items-center gap-2 mb-3">
            <div className="h-8 w-8 rounded-lg bg-orange-100 dark:bg-orange-900/20 flex items-center justify-center">
              <Users className="h-4 w-4 text-orange-500" />
            </div>
            <h3 className="font-semibold text-sm text-[var(--color-foreground)]">{team.name}</h3>
          </div>
          <div className="space-y-2">
            {team.members.map((member) => (
              <div key={member.player.id} className="flex items-center gap-2">
                <Avatar name={member.player.name} src={member.player.avatarUrl} size="sm" />
                <span className="text-sm text-[var(--color-foreground)]">{member.player.name}</span>
              </div>
            ))}
          </div>
        </Card>
      ))}
    </div>
  );
}

