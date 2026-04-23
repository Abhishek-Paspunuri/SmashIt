"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  Badge,
  TournamentStatusBadge,
  MatchStatusBadge,
} from "@/components/ui/badge";
import { Avatar } from "@/components/ui/avatar";
import { useToast } from "@/components/ui/toast";
import { Modal } from "@/components/ui/modal";
import {
  ArrowLeft,
  Play,
  CheckCircle2,
  Users,
  Trophy,
  Swords,
  Medal,
  ChevronDown,
  Pencil,
} from "lucide-react";
import type {
  TournamentDetail,
  RankedTeam,
  MatchWithTeams,
  TeamWithMembers,
  PlayoffMatchWithTeams,
} from "@/types";
import Link from "next/link";
import { cn } from "@/lib/utils";

type Tab = "matches" | "scoreboard" | "teams" | "playoffs";

interface TournamentDetailClientProps {
  tournament: TournamentDetail;
  initialStandings: RankedTeam[];
}

export function TournamentDetailClient({
  tournament: initial,
  initialStandings,
}: TournamentDetailClientProps) {
  const router = useRouter();
  const { toast } = useToast();
  const [tournament, setTournament] = useState(initial);
  const [standings, setStandings] = useState(initialStandings);
  const [tab, setTab] = useState<Tab>("matches");
  const [statusLoading, setStatusLoading] = useState(false);
  const [completeMatch, setCompleteMatch] = useState<MatchWithTeams | null>(
    null,
  );
  const [editMatch, setEditMatch] = useState<MatchWithTeams | null>(null);
  const [confirmFinish, setConfirmFinish] = useState(false);

  // Playoffs state
  const [playoffs, setPlayoffs] = useState<PlayoffMatchWithTeams[]>([]);
  const [playoffsLoaded, setPlayoffsLoaded] = useState(false);
  const [topN, setTopN] = useState(4);
  const [completePlayoffMatch, setCompletePlayoffMatch] =
    useState<PlayoffMatchWithTeams | null>(null);

  const allMatchesDone =
    tournament.matches.length > 0 &&
    tournament.matches.every((m) => m.status === "COMPLETED");

  async function handleStatusChange(status: string) {
    setStatusLoading(true);
    try {
      const res = await fetch(`/api/tournaments/${tournament.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      if (!res.ok) throw new Error("Failed");

      // Refetch full tournament (includes newly generated matches) and update local state
      const updatedRes = await fetch(`/api/tournaments/${tournament.id}`);
      if (updatedRes.ok) {
        const updatedJson = await updatedRes.json();
        setTournament(updatedJson.data);
      }

      toast(
        `Tournament ${status === "LIVE" ? "started" : "completed"}!`,
        "success",
      );
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
          m.id === matchId ? { ...m, status: "LIVE" as const } : m,
        ),
      }));
      toast("Match started!", "success");
    } catch {
      toast("Failed to start match", "error");
    }
  }

  async function handleCompleteMatch(
    matchId: string,
    winnerId: string,
    homeScore: number,
    awayScore: number,
  ) {
    try {
      const res = await fetch(`/api/matches/${matchId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "complete",
          winnerId,
          homeScore,
          awayScore,
        }),
      });
      if (!res.ok) throw new Error("Failed");

      setTournament((prev) => ({
        ...prev,
        matches: prev.matches.map((m) =>
          m.id === matchId
            ? {
                ...m,
                status: "COMPLETED" as const,
                winnerId,
                homeScore,
                awayScore,
              }
            : m,
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

  async function handleEditMatch(
    matchId: string,
    winnerId: string,
    homeScore: number,
    awayScore: number,
  ) {
    try {
      const res = await fetch(`/api/matches/${matchId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "update",
          winnerId,
          homeScore,
          awayScore,
        }),
      });
      if (!res.ok) throw new Error("Failed");

      setTournament((prev) => ({
        ...prev,
        matches: prev.matches.map((m) =>
          m.id === matchId ? { ...m, winnerId, homeScore, awayScore } : m,
        ),
      }));

      const sRes = await fetch(`/api/tournaments/${tournament.id}/scoreboard`);
      if (sRes.ok) {
        const sJson = await sRes.json();
        setStandings(sJson.data);
      }

      setEditMatch(null);
      toast("Score updated!", "success");
    } catch {
      toast("Failed to update score", "error");
    }
  }

  async function handleTabChange(t: Tab) {
    setTab(t);
    if (t === "playoffs" && !playoffsLoaded) {
      try {
        const res = await fetch(`/api/tournaments/${tournament.id}/playoffs`);
        if (res.ok) {
          const json = await res.json();
          setPlayoffs(json.data);
        }
      } catch {
        // ignore
      } finally {
        setPlayoffsLoaded(true);
      }
    }
  }

  async function handleCreatePlayoffs(n: number) {
    try {
      const res = await fetch(`/api/tournaments/${tournament.id}/playoffs`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ topN: n }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Failed");
      setPlayoffs(json.data);
      toast("Playoff bracket created!", "success");
    } catch (e) {
      toast((e as Error).message, "error");
    }
  }

  async function handleCompletePlayoffMatch(
    matchId: string,
    winnerId: string,
    homeScore: number,
    awayScore: number,
  ) {
    try {
      const res = await fetch(`/api/playoffs/${matchId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ winnerId, homeScore, awayScore }),
      });
      if (!res.ok) {
        const json = await res.json();
        throw new Error(json.error || "Failed");
      }
      // Refresh playoffs
      const pRes = await fetch(`/api/tournaments/${tournament.id}/playoffs`);
      if (pRes.ok) {
        const pJson = await pRes.json();
        setPlayoffs(pJson.data);
      }
      setCompletePlayoffMatch(null);
      toast("Match completed!", "success");
    } catch (e) {
      toast((e as Error).message, "error");
    }
  }

  const upcoming = tournament.matches.filter((m) => m.status === "UPCOMING");
  const live = tournament.matches.filter((m) => m.status === "LIVE");
  const completed = tournament.matches.filter((m) => m.status === "COMPLETED");

  return (
    <div className="max-w-2xl mx-auto px-3 py-5 pb-2">
      {/* Back */}
      <Link
        href="/tournaments"
        className="inline-flex items-center gap-1 text-sm text-[var(--color-muted)] hover:text-orange-500 mb-4"
      >
        <ArrowLeft className="h-3.5 w-3.5" /> Tournaments
      </Link>

      {/* Header */}
      <div className="flex items-start justify-between gap-3 mb-4">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <h1 className="text-xl font-bold text-[var(--color-foreground)] truncate">
              {tournament.name}
            </h1>
            <TournamentStatusBadge status={tournament.status} />
          </div>
          {tournament.description && (
            <p className="text-sm text-[var(--color-muted)] mt-0.5">
              {tournament.description}
            </p>
          )}
          <div className="flex gap-3 mt-2 text-xs text-[var(--color-muted)]">
            <span>{tournament.teams.length} teams</span>
            <span>{tournament.matches.length} matches</span>
            <span>{tournament.participants.length} players</span>
          </div>
        </div>
        {/* Status actions */}
        {tournament.status === "DRAFT" && (
          <Button
            size="sm"
            onClick={() => handleStatusChange("LIVE")}
            loading={statusLoading}
          >
            <Play className="h-3.5 w-3.5" />
            Start
          </Button>
        )}
        {tournament.status === "LIVE" && (
          <Button
            size="sm"
            variant="secondary"
            onClick={() => setConfirmFinish(true)}
            loading={statusLoading}
          >
            <CheckCircle2 className="h-3.5 w-3.5" />
            Finish
          </Button>
        )}
      </div>

      {/* Tabs + scrollable content box */}
      <div
        className="rounded-2xl border border-border bg-surface-3 overflow-hidden flex flex-col sm:mb-4"
        style={{ maxHeight: "calc(100dvh - 280px)" }}
      >
        {/* Tab bar */}
        <div className="flex border-b border-border shrink-0">
          {(["matches", "scoreboard", "teams", "playoffs"] as Tab[]).map(
            (t) => (
              <button
                key={t}
                onClick={() => handleTabChange(t)}
                className={cn(
                  "flex-1 py-2.5 text-sm font-medium capitalize transition-colors border-b-2 -mb-px",
                  tab === t
                    ? "border-orange-500 text-orange-500"
                    : "border-transparent text-muted hover:text-foreground",
                )}
              >
                {t}
              </button>
            ),
          )}
        </div>

        {/* Scrollable content */}
        <div className="overflow-y-auto flex-1 p-4">
          {/* Tab: Matches */}
          {tab === "matches" && (
            <div className="space-y-4">
              {tournament.matches.length === 0 && (
                <div className="text-center py-12 text-muted text-sm">
                  {tournament.status === "DRAFT"
                    ? "Start the tournament to generate matches."
                    : "No matches scheduled yet."}
                </div>
              )}

              {live.length > 0 && (
                <Section title="Live" accent="blue">
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
                <Section title="Upcoming" accent="orange">
                  {upcoming.map((m) => (
                    <MatchCard
                      key={m.id}
                      match={m}
                      onStart={() => handleStartMatch(m.id)}
                    />
                  ))}
                </Section>
              )}

              {completed.length > 0 && (
                <Section title="Completed" accent="green">
                  {completed.map((m) => (
                    <MatchCard
                      key={m.id}
                      match={m}
                      onEdit={() => setEditMatch(m)}
                    />
                  ))}
                </Section>
              )}
            </div>
          )}

          {/* Tab: Scoreboard */}
          {tab === "scoreboard" && <ScoreboardTab standings={standings} />}

          {/* Tab: Teams */}
          {tab === "teams" && <TeamsTab teams={tournament.teams} />}

          {/* Tab: Playoffs */}
          {tab === "playoffs" && (
            <PlayoffsTab
              playoffs={playoffs}
              allMatchesDone={allMatchesDone}
              topN={topN}
              onTopNChange={setTopN}
              onCreatePlayoffs={handleCreatePlayoffs}
              onCompleteMatch={(m) => setCompletePlayoffMatch(m)}
            />
          )}
        </div>
      </div>

      {/* Scoreboard legend — fixed above bottom navbar, only on scoreboard tab */}
      {tab === "scoreboard" && (
        <div className="fixed bottom-16 left-0 right-0 z-20 px-4 sm:bottom-0">
          <div className="max-w-2xl mx-auto rounded-xl border border-border bg-surface-3 backdrop-blur-sm px-4 py-3 grid grid-cols-2 sm:grid-cols-3 gap-x-4 gap-y-2.5 shadow-lg">
            {[
              { key: "P", label: "Played", desc: "Total matches played" },
              { key: "W", label: "Wins", desc: "Matches won" },
              { key: "L", label: "Losses", desc: "Matches lost" },
              { key: "PF", label: "Points For", desc: "Total points scored" },
              {
                key: "PA",
                label: "Points Against",
                desc: "Total points conceded",
              },
              { key: "+/-", label: "Point Diff", desc: "PF minus PA" },
            ].map(({ key, label, desc }) => (
              <div key={key} className="flex items-start gap-2">
                <span className="text-[11px] font-bold text-orange-500 w-7 shrink-0 pt-px">
                  {key}
                </span>
                <div>
                  <p className="text-[11px] font-semibold text-foreground leading-tight">
                    {label}
                  </p>
                  <p className="text-[10px] text-muted leading-tight">{desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Complete Match Modal */}
      {completeMatch && (
        <CompleteMatchModal
          match={completeMatch}
          onClose={() => setCompleteMatch(null)}
          onComplete={handleCompleteMatch}
        />
      )}

      {/* Edit Score Modal */}
      {editMatch && (
        <CompleteMatchModal
          match={editMatch}
          onClose={() => setEditMatch(null)}
          onComplete={handleEditMatch}
          title="Edit Score"
          initialWinnerId={editMatch.winnerId ?? undefined}
          initialWinnerScore={
            editMatch.winnerId === editMatch.homeTeamId
              ? (editMatch.homeScore ?? 21)
              : (editMatch.awayScore ?? 21)
          }
          initialLoserScore={
            editMatch.winnerId === editMatch.homeTeamId
              ? (editMatch.awayScore ?? 15)
              : (editMatch.homeScore ?? 15)
          }
        />
      )}

      {/* Complete Playoff Match Modal */}
      {completePlayoffMatch && (
        <CompletePlayoffMatchModal
          match={completePlayoffMatch}
          onClose={() => setCompletePlayoffMatch(null)}
          onComplete={handleCompletePlayoffMatch}
        />
      )}

      {/* Finish Tournament Confirmation */}
      {confirmFinish && (
        <Modal
          open
          onClose={() => setConfirmFinish(false)}
          title="Finish Tournament"
        >
          <div className="space-y-4">
            <p className="text-sm text-muted">
              Are you sure you want to finish{" "}
              <span className="font-semibold text-foreground">
                {tournament.name}
              </span>
              ? This will mark the tournament as completed and lock all results.
            </p>
            <div className="flex gap-3">
              <Button
                variant="outline"
                className="flex-1"
                onClick={() => setConfirmFinish(false)}
              >
                Cancel
              </Button>
              <Button
                className="flex-1"
                loading={statusLoading}
                onClick={async () => {
                  setConfirmFinish(false);
                  await handleStatusChange("COMPLETED");
                }}
              >
                <CheckCircle2 className="h-4 w-4" />
                Finish
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}

// ── Section ──────────────────────────────────────────────────────────────────

function Section({
  title,
  accent,
  children,
}: {
  title: string;
  accent?: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <h3
        className={cn(
          "text-xs font-semibold uppercase tracking-wide mb-2",
          accent === "orange"
            ? "text-orange-500"
            : accent === "blue"
              ? "text-[#7A5020] dark:text-[#FCF1E3]"
              : accent === "green"
                ? "text-green-500"
                : "text-muted",
        )}
      >
        {title}
      </h3>
      <div className="space-y-2">{children}</div>
    </div>
  );
}

// ── Match Card ───────────────────────────────────────────────────────────────

function MatchCard({
  match,
  onStart,
  onComplete,
  onEdit,
}: {
  match: MatchWithTeams;
  onStart?: () => void;
  onComplete?: () => void;
  onEdit?: () => void;
}) {
  const isLive = match.status === "LIVE";
  const isDone = match.status === "COMPLETED";

  const homeWon = isDone && match.winnerId === match.homeTeamId;
  const awayWon = isDone && match.winnerId === match.awayTeamId;

  return (
    <Card
      padded={false}
      className={cn(
        "overflow-hidden",
        isLive &&
          "border-[#7A5020]/50 dark:border-[#FCF1E3]/30 shadow-[0_0_0_1px_rgba(122,80,32,0.12)] dark:shadow-[0_0_0_1px_rgba(252,241,227,0.08)]",
      )}
    >
      {/* Top accent strip */}
      {isLive && <div className="h-0.5 bg-[#7A5020] dark:bg-[#FCF1E3]" />}

      {isDone ? (
        /* ── Completed layout: name + score on one line, players below ── */
        <div className="flex items-stretch gap-2 p-3 relative">
          {/* Home side */}
          <div
            className={cn(
              "flex-1 min-w-0 rounded-lg px-2 py-1.5 transition-all",
              homeWon
                ? "bg-green-500/10 ring-1 ring-green-500/25 shadow-[0_0_12px_0_rgba(34,197,94,0.15)]"
                : "",
            )}
          >
            <div className="flex items-center justify-end gap-1.5">
              {homeWon && <span className="text-xs text-green-400">🏆</span>}
              <p
                className={cn(
                  "text-sm font-semibold truncate",
                  homeWon ? "text-green-400" : "text-foreground",
                )}
              >
                {match.homeTeam.name}
              </p>
              <span
                className={cn(
                  "text-base font-bold tabular-nums shrink-0",
                  homeWon ? "text-green-400" : "text-muted",
                )}
              >
                {match.homeScore}
              </span>
            </div>
            <div className="flex justify-end gap-1 mt-0.5">
              {match.homeTeam.members.slice(0, 2).map((m) => (
                <span
                  key={m.player.id}
                  className="text-[10px] text-muted truncate max-w-16"
                >
                  {m.player.name.split(" ")[0]}
                </span>
              ))}
            </div>
          </div>

          {/* Divider + edit */}
          <div className="flex flex-col items-center gap-1 self-center shrink-0">
            <span className="text-muted text-xs">—</span>
            {onEdit && (
              <button
                onClick={onEdit}
                className="p-1 rounded-md text-muted hover:text-foreground hover:bg-surface-3 transition-colors"
                title="Edit score"
              >
                <Pencil className="h-3 w-3" />
              </button>
            )}
          </div>

          {/* Away side */}
          <div
            className={cn(
              "flex-1 min-w-0 rounded-lg px-2 py-1.5 transition-all",
              awayWon
                ? "bg-green-500/10 ring-1 ring-green-500/25 shadow-[0_0_12px_0_rgba(34,197,94,0.15)]"
                : "",
            )}
          >
            <div className="flex items-center gap-1.5">
              <span
                className={cn(
                  "text-base font-bold tabular-nums shrink-0",
                  awayWon ? "text-green-400" : "text-muted",
                )}
              >
                {match.awayScore}
              </span>
              <p
                className={cn(
                  "text-sm font-semibold truncate",
                  awayWon ? "text-green-400" : "text-foreground",
                )}
              >
                {match.awayTeam.name}
              </p>
              {awayWon && <span className="text-xs text-green-400">🏆</span>}
            </div>
            <div className="flex gap-1 mt-0.5">
              {match.awayTeam.members.slice(0, 2).map((m) => (
                <span
                  key={m.player.id}
                  className="text-[10px] text-muted truncate max-w-16"
                >
                  {m.player.name.split(" ")[0]}
                </span>
              ))}
            </div>
          </div>
        </div>
      ) : (
        /* ── Live / Upcoming layout ── */
        <div className="flex items-center gap-2 p-3">
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between gap-2">
              {/* Home */}
              <div className="flex-1 text-right">
                <p className="text-sm font-semibold truncate text-foreground">
                  {match.homeTeam.name}
                </p>
                <div className="flex justify-end gap-1 mt-0.5">
                  {match.homeTeam.members.slice(0, 2).map((m) => (
                    <span
                      key={m.player.id}
                      className="text-[10px] text-muted truncate max-w-16"
                    >
                      {m.player.name.split(" ")[0]}
                    </span>
                  ))}
                </div>
              </div>
              {/* vs */}
              <span className="text-xs text-muted px-2 shrink-0">vs</span>
              {/* Away */}
              <div className="flex-1">
                <p className="text-sm font-semibold truncate text-foreground">
                  {match.awayTeam.name}
                </p>
                <div className="flex gap-1 mt-0.5">
                  {match.awayTeam.members.slice(0, 2).map((m) => (
                    <span
                      key={m.player.id}
                      className="text-[10px] text-muted truncate max-w-16"
                    >
                      {m.player.name.split(" ")[0]}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Actions */}
          {onStart && (
            <Button size="sm" variant="primary" onClick={onStart}>
              <Play className="h-3.5 w-3.5" />
            </Button>
          )}
          {onComplete && (
            <Button size="sm" variant="blue" onClick={onComplete}>
              Done
            </Button>
          )}
        </div>
      )}
    </Card>
  );
}

// ── Complete Match Modal ──────────────────────────────────────────────────────

function CompleteMatchModal({
  match,
  onClose,
  onComplete,
  title: modalTitle,
  initialWinnerId,
  initialWinnerScore,
  initialLoserScore,
}: {
  match: MatchWithTeams;
  onClose: () => void;
  onComplete: (
    matchId: string,
    winnerId: string,
    homeScore: number,
    awayScore: number,
  ) => void;
  title?: string;
  initialWinnerId?: string;
  initialWinnerScore?: number;
  initialLoserScore?: number;
}) {
  const [winnerId, setWinnerId] = useState<string>(initialWinnerId ?? "");
  const [winnerScore, setWinnerScore] = useState(initialWinnerScore ?? 21);
  const [loserScore, setLoserScore] = useState(initialLoserScore ?? 15);
  const [loading, setLoading] = useState(false);

  const homeIsWinner = winnerId === match.homeTeamId;
  const awayIsWinner = winnerId === match.awayTeamId;
  const homeScore = homeIsWinner ? winnerScore : awayIsWinner ? loserScore : 0;
  const awayScore = awayIsWinner ? winnerScore : homeIsWinner ? loserScore : 0;
  const scoreDiff = winnerScore - loserScore;
  const validGap = scoreDiff >= 2;

  async function handleSubmit() {
    if (!winnerId || !validGap) return;
    setLoading(true);
    await onComplete(match.id, winnerId, homeScore, awayScore);
    setLoading(false);
  }

  return (
    <Modal open onClose={onClose} title={modalTitle ?? "Complete Match"}>
      <div className="space-y-4">
        <p className="text-sm text-[var(--color-muted)]">
          Select the winning team.
        </p>

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
                  : "border-[var(--color-border)] hover:border-orange-300",
              )}
            >
              <div className="flex items-center gap-1.5 flex-wrap">
                {team.members.map((m) => (
                  <Avatar
                    key={m.player.id}
                    name={m.player.name}
                    src={m.player.avatarUrl}
                    size="xs"
                  />
                ))}
              </div>
              <p className="text-sm font-semibold text-[var(--color-foreground)] mt-2">
                {team.name}
              </p>
              {winnerId === id && (
                <div className="flex items-center gap-1 mt-1">
                  <Trophy className="h-3 w-3 text-orange-500" />
                  <span className="text-xs text-orange-500 font-semibold">
                    Winner
                  </span>
                </div>
              )}
            </button>
          ))}
        </div>

        {/* Score inputs — columns align with team selector above */}
        {winnerId && (
          <div className="grid grid-cols-2 gap-3">
            {/* Left column = home team */}
            <div>
              <label
                className={cn(
                  "text-xs font-medium block mb-2 text-center",
                  homeIsWinner
                    ? "text-orange-500"
                    : "text-[var(--color-muted)]",
                )}
              >
                {homeIsWinner ? "Winner (21–30)" : "Loser (0–30)"}
              </label>
              <ScoreScroller
                value={homeIsWinner ? winnerScore : loserScore}
                onChange={homeIsWinner ? setWinnerScore : setLoserScore}
                min={homeIsWinner ? 21 : 0}
                max={30}
              />
            </div>
            {/* Right column = away team */}
            <div>
              <label
                className={cn(
                  "text-xs font-medium block mb-2 text-center",
                  awayIsWinner
                    ? "text-orange-500"
                    : "text-[var(--color-muted)]",
                )}
              >
                {awayIsWinner ? "Winner (21–30)" : "Loser (0–30)"}
              </label>
              <ScoreScroller
                value={awayIsWinner ? winnerScore : loserScore}
                onChange={awayIsWinner ? setWinnerScore : setLoserScore}
                min={awayIsWinner ? 21 : 0}
                max={30}
              />
            </div>
          </div>
        )}

        {/* Preview */}
        {winnerId && (
          <div className="flex items-center justify-center gap-4 py-2 rounded-xl bg-[var(--color-surface-3)]">
            <div className="text-center">
              <p className="text-xs text-[var(--color-muted)] truncate">
                {match.homeTeam.name}
              </p>
              <p
                className={cn(
                  "text-2xl font-bold",
                  homeIsWinner
                    ? "text-orange-500"
                    : "text-[var(--color-foreground)]",
                )}
              >
                {homeScore}
              </p>
            </div>
            <span className="text-[var(--color-muted)]">—</span>
            <div className="text-center">
              <p className="text-xs text-[var(--color-muted)] truncate">
                {match.awayTeam.name}
              </p>
              <p
                className={cn(
                  "text-2xl font-bold",
                  awayIsWinner
                    ? "text-orange-500"
                    : "text-[var(--color-foreground)]",
                )}
              >
                {awayScore}
              </p>
            </div>
          </div>
        )}

        {winnerId && !validGap && (
          <p className="text-xs text-red-500 text-center px-2 py-2 rounded-lg bg-red-500/10 leading-relaxed">
            Winning score must be at least 2 points ahead of the losing score.
          </p>
        )}

        <Button
          className="w-full"
          onClick={handleSubmit}
          loading={loading}
          disabled={!winnerId || !validGap}
        >
          Save Result
        </Button>
      </div>
    </Modal>
  );
}

// ── Score Scroller ────────────────────────────────────────────────────────────

function ScoreScroller({
  value,
  onChange,
  min,
  max,
}: {
  value: number;
  onChange: (v: number) => void;
  min: number;
  max: number;
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
                n === value ? "text-orange-500" : "text-[var(--color-muted)]",
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
            <th className="text-left pl-4 py-2 text-xs font-semibold text-[var(--color-muted)] w-8">
              #
            </th>
            <th className="text-left py-2 text-xs font-semibold text-[var(--color-muted)] w-24 max-w-[96px]">
              Team
            </th>
            <th className="text-center py-2 text-xs font-semibold text-[var(--color-muted)] w-10">
              P
            </th>
            <th className="text-center py-2 text-xs font-semibold text-[var(--color-muted)] w-10">
              W
            </th>
            <th className="text-center py-2 text-xs font-semibold text-[var(--color-muted)] w-10">
              L
            </th>
            <th className="text-center py-2 text-xs font-semibold text-[var(--color-muted)] w-12">
              PF
            </th>
            <th className="text-center py-2 text-xs font-semibold text-[var(--color-muted)] w-12">
              PA
            </th>
            <th className="text-center pr-4 py-2 text-xs font-semibold text-[var(--color-muted)] w-12">
              +/-
            </th>
          </tr>
        </thead>
        <tbody>
          {standings.map((team, i) => (
            <tr
              key={team.teamId}
              className={cn(
                "border-b border-[var(--color-border)] transition-colors",
                i === 0 && "bg-orange-50/50 dark:bg-orange-900/10",
              )}
            >
              <td className="pl-4 py-3 text-sm font-bold text-[var(--color-muted)]">
                {i === 0 ? (
                  <Medal className="h-4 w-4 text-orange-500 inline" />
                ) : (
                  team.rank
                )}
              </td>
              <td className="py-3 font-semibold text-[var(--color-foreground)] max-w-24 truncate">
                {team.name}
              </td>
              <td className="text-center py-3 text-[var(--color-muted)]">
                {team.played}
              </td>
              <td className="text-center py-3 font-semibold text-green-600 dark:text-green-400">
                {team.wins}
              </td>
              <td className="text-center py-3 text-[var(--color-muted)]">
                {team.losses}
              </td>
              <td className="text-center py-3 text-[var(--color-muted)]">
                {team.pointsFor}
              </td>
              <td className="text-center py-3 text-[var(--color-muted)]">
                {team.pointsAgainst}
              </td>
              <td
                className={cn(
                  "text-center pr-4 py-3 font-medium",
                  team.pointDiff > 0
                    ? "text-green-600 dark:text-green-400"
                    : team.pointDiff < 0
                      ? "text-red-500"
                      : "text-[var(--color-muted)]",
                )}
              >
                {team.pointDiff > 0 ? `+${team.pointDiff}` : team.pointDiff}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

// ── Playoffs Tab ─────────────────────────────────────────────────────────────

function Bracket4Svg() {
  return (
    <svg
      width="320"
      height="200"
      viewBox="0 0 320 200"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className="mx-auto"
    >
      {/* Round 1 boxes */}
      <rect
        x="8"
        y="20"
        width="72"
        height="28"
        rx="5"
        fill="var(--color-surface)"
        stroke="#f97316"
        strokeOpacity="0.4"
      />
      <text
        x="44"
        y="38"
        textAnchor="middle"
        fill="currentColor"
        fontSize="10"
        opacity="0.7"
      >
        T1
      </text>
      <rect
        x="8"
        y="60"
        width="72"
        height="28"
        rx="5"
        fill="var(--color-surface)"
        stroke="#f97316"
        strokeOpacity="0.4"
      />
      <text
        x="44"
        y="78"
        textAnchor="middle"
        fill="currentColor"
        fontSize="10"
        opacity="0.7"
      >
        T2
      </text>
      <rect
        x="8"
        y="120"
        width="72"
        height="28"
        rx="5"
        fill="var(--color-surface)"
        stroke="#f97316"
        strokeOpacity="0.4"
      />
      <text
        x="44"
        y="138"
        textAnchor="middle"
        fill="currentColor"
        fontSize="10"
        opacity="0.7"
      >
        T3
      </text>
      <rect
        x="8"
        y="160"
        width="72"
        height="28"
        rx="5"
        fill="var(--color-surface)"
        stroke="#f97316"
        strokeOpacity="0.4"
      />
      <text
        x="44"
        y="178"
        textAnchor="middle"
        fill="currentColor"
        fontSize="10"
        opacity="0.7"
      >
        T4
      </text>
      {/* Lines R1 → R2 */}
      <line
        x1="80"
        y1="34"
        x2="100"
        y2="34"
        stroke="#f97316"
        strokeOpacity="0.3"
        strokeDasharray="4 3"
      />
      <line
        x1="80"
        y1="74"
        x2="100"
        y2="74"
        stroke="#f97316"
        strokeOpacity="0.3"
        strokeDasharray="4 3"
      />
      <line
        x1="100"
        y1="34"
        x2="100"
        y2="74"
        stroke="#f97316"
        strokeOpacity="0.3"
        strokeDasharray="4 3"
      />
      <line
        x1="80"
        y1="134"
        x2="100"
        y2="134"
        stroke="#f97316"
        strokeOpacity="0.3"
        strokeDasharray="4 3"
      />
      <line
        x1="80"
        y1="174"
        x2="100"
        y2="174"
        stroke="#f97316"
        strokeOpacity="0.3"
        strokeDasharray="4 3"
      />
      <line
        x1="100"
        y1="134"
        x2="100"
        y2="174"
        stroke="#f97316"
        strokeOpacity="0.3"
        strokeDasharray="4 3"
      />
      {/* Round 2 boxes */}
      <rect
        x="108"
        y="44"
        width="72"
        height="28"
        rx="5"
        fill="var(--color-surface)"
        stroke="#f97316"
        strokeOpacity="0.4"
      />
      <text
        x="144"
        y="62"
        textAnchor="middle"
        fill="currentColor"
        fontSize="9"
        opacity="0.7"
      >
        W(M1)
      </text>
      <rect
        x="108"
        y="140"
        width="72"
        height="28"
        rx="5"
        fill="var(--color-surface)"
        stroke="#f97316"
        strokeOpacity="0.4"
      />
      <text
        x="144"
        y="158"
        textAnchor="middle"
        fill="currentColor"
        fontSize="9"
        opacity="0.7"
      >
        Lower Final
      </text>
      {/* Lines R2 → GF */}
      <line
        x1="180"
        y1="58"
        x2="200"
        y2="58"
        stroke="#f97316"
        strokeOpacity="0.3"
        strokeDasharray="4 3"
      />
      <line
        x1="180"
        y1="154"
        x2="200"
        y2="154"
        stroke="#f97316"
        strokeOpacity="0.3"
        strokeDasharray="4 3"
      />
      <line
        x1="200"
        y1="58"
        x2="200"
        y2="154"
        stroke="#f97316"
        strokeOpacity="0.3"
        strokeDasharray="4 3"
      />
      {/* Grand Final */}
      <rect
        x="208"
        y="96"
        width="88"
        height="30"
        rx="5"
        fill="var(--color-surface)"
        stroke="#f97316"
        strokeOpacity="0.7"
      />
      <text
        x="252"
        y="108"
        textAnchor="middle"
        fill="#f97316"
        fontSize="9"
        fontWeight="bold"
      >
        Grand
      </text>
      <text
        x="252"
        y="120"
        textAnchor="middle"
        fill="#f97316"
        fontSize="9"
        fontWeight="bold"
      >
        Final
      </text>
      {/* Loser drop lines */}
      <line
        x1="100"
        y1="54"
        x2="100"
        y2="100"
        stroke="#f97316"
        strokeOpacity="0.2"
        strokeDasharray="3 4"
      />
      <line
        x1="100"
        y1="100"
        x2="108"
        y2="154"
        stroke="#f97316"
        strokeOpacity="0.2"
        strokeDasharray="3 4"
      />
    </svg>
  );
}

function Bracket6Svg() {
  return (
    <svg
      width="360"
      height="280"
      viewBox="0 0 360 280"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className="mx-auto"
    >
      {/* Round 1 boxes */}
      <rect
        x="4"
        y="10"
        width="66"
        height="24"
        rx="4"
        fill="var(--color-surface)"
        stroke="#f97316"
        strokeOpacity="0.4"
      />
      <text
        x="37"
        y="26"
        textAnchor="middle"
        fill="currentColor"
        fontSize="9"
        opacity="0.7"
      >
        T1
      </text>
      <rect
        x="4"
        y="44"
        width="66"
        height="24"
        rx="4"
        fill="var(--color-surface)"
        stroke="#f97316"
        strokeOpacity="0.4"
      />
      <text
        x="37"
        y="60"
        textAnchor="middle"
        fill="currentColor"
        fontSize="9"
        opacity="0.7"
      >
        T2
      </text>
      <rect
        x="4"
        y="108"
        width="66"
        height="24"
        rx="4"
        fill="var(--color-surface)"
        stroke="#f97316"
        strokeOpacity="0.4"
      />
      <text
        x="37"
        y="124"
        textAnchor="middle"
        fill="currentColor"
        fontSize="9"
        opacity="0.7"
      >
        T3
      </text>
      <rect
        x="4"
        y="142"
        width="66"
        height="24"
        rx="4"
        fill="var(--color-surface)"
        stroke="#f97316"
        strokeOpacity="0.4"
      />
      <text
        x="37"
        y="158"
        textAnchor="middle"
        fill="currentColor"
        fontSize="9"
        opacity="0.7"
      >
        T4
      </text>
      <rect
        x="4"
        y="206"
        width="66"
        height="24"
        rx="4"
        fill="var(--color-surface)"
        stroke="#f97316"
        strokeOpacity="0.4"
      />
      <text
        x="37"
        y="222"
        textAnchor="middle"
        fill="currentColor"
        fontSize="9"
        opacity="0.7"
      >
        T5
      </text>
      <rect
        x="4"
        y="240"
        width="66"
        height="24"
        rx="4"
        fill="var(--color-surface)"
        stroke="#f97316"
        strokeOpacity="0.4"
      />
      <text
        x="37"
        y="256"
        textAnchor="middle"
        fill="currentColor"
        fontSize="9"
        opacity="0.7"
      >
        T6
      </text>
      {/* R1 connectors */}
      <line
        x1="70"
        y1="22"
        x2="86"
        y2="22"
        stroke="#f97316"
        strokeOpacity="0.3"
        strokeDasharray="4 3"
      />
      <line
        x1="70"
        y1="56"
        x2="86"
        y2="56"
        stroke="#f97316"
        strokeOpacity="0.3"
        strokeDasharray="4 3"
      />
      <line
        x1="86"
        y1="22"
        x2="86"
        y2="56"
        stroke="#f97316"
        strokeOpacity="0.3"
        strokeDasharray="4 3"
      />
      <line
        x1="70"
        y1="120"
        x2="86"
        y2="120"
        stroke="#f97316"
        strokeOpacity="0.3"
        strokeDasharray="4 3"
      />
      <line
        x1="70"
        y1="154"
        x2="86"
        y2="154"
        stroke="#f97316"
        strokeOpacity="0.3"
        strokeDasharray="4 3"
      />
      <line
        x1="86"
        y1="120"
        x2="86"
        y2="154"
        stroke="#f97316"
        strokeOpacity="0.3"
        strokeDasharray="4 3"
      />
      <line
        x1="70"
        y1="218"
        x2="86"
        y2="218"
        stroke="#f97316"
        strokeOpacity="0.3"
        strokeDasharray="4 3"
      />
      <line
        x1="70"
        y1="252"
        x2="86"
        y2="252"
        stroke="#f97316"
        strokeOpacity="0.3"
        strokeDasharray="4 3"
      />
      <line
        x1="86"
        y1="218"
        x2="86"
        y2="252"
        stroke="#f97316"
        strokeOpacity="0.3"
        strokeDasharray="4 3"
      />
      {/* Round 2 boxes */}
      <rect
        x="92"
        y="30"
        width="66"
        height="24"
        rx="4"
        fill="var(--color-surface)"
        stroke="#f97316"
        strokeOpacity="0.4"
      />
      <text
        x="125"
        y="46"
        textAnchor="middle"
        fill="currentColor"
        fontSize="8"
        opacity="0.7"
      >
        W(T1vT2)
      </text>
      <rect
        x="92"
        y="170"
        width="66"
        height="24"
        rx="4"
        fill="var(--color-surface)"
        stroke="#f97316"
        strokeOpacity="0.4"
      />
      <text
        x="125"
        y="186"
        textAnchor="middle"
        fill="currentColor"
        fontSize="8"
        opacity="0.7"
      >
        Lower Semi
      </text>
      {/* R2 connectors */}
      <line
        x1="158"
        y1="42"
        x2="178"
        y2="42"
        stroke="#f97316"
        strokeOpacity="0.3"
        strokeDasharray="4 3"
      />
      <line
        x1="158"
        y1="182"
        x2="178"
        y2="182"
        stroke="#f97316"
        strokeOpacity="0.3"
        strokeDasharray="4 3"
      />
      <line
        x1="178"
        y1="42"
        x2="178"
        y2="182"
        stroke="#f97316"
        strokeOpacity="0.3"
        strokeDasharray="4 3"
      />
      {/* Lower Final */}
      <rect
        x="186"
        y="102"
        width="66"
        height="24"
        rx="4"
        fill="var(--color-surface)"
        stroke="#f97316"
        strokeOpacity="0.4"
      />
      <text
        x="219"
        y="118"
        textAnchor="middle"
        fill="currentColor"
        fontSize="8"
        opacity="0.7"
      >
        Lower Final
      </text>
      {/* Lower Final → GF */}
      <line
        x1="252"
        y1="114"
        x2="272"
        y2="114"
        stroke="#f97316"
        strokeOpacity="0.3"
        strokeDasharray="4 3"
      />
      <line
        x1="272"
        y1="42"
        x2="272"
        y2="114"
        stroke="#f97316"
        strokeOpacity="0.3"
        strokeDasharray="4 3"
      />
      {/* Grand Final */}
      <rect
        x="280"
        y="68"
        width="72"
        height="30"
        rx="5"
        fill="var(--color-surface)"
        stroke="#f97316"
        strokeOpacity="0.7"
      />
      <text
        x="316"
        y="80"
        textAnchor="middle"
        fill="#f97316"
        fontSize="9"
        fontWeight="bold"
      >
        Grand
      </text>
      <text
        x="316"
        y="92"
        textAnchor="middle"
        fill="#f97316"
        fontSize="9"
        fontWeight="bold"
      >
        Final
      </text>
    </svg>
  );
}

function PlayoffsTab({
  playoffs,
  allMatchesDone,
  topN,
  onTopNChange,
  onCreatePlayoffs,
  onCompleteMatch,
}: {
  playoffs: PlayoffMatchWithTeams[];
  allMatchesDone: boolean;
  topN: number;
  onTopNChange: (n: number) => void;
  onCreatePlayoffs: (n: number) => Promise<void>;
  onCompleteMatch: (m: PlayoffMatchWithTeams) => void;
}) {
  const [creating, setCreating] = useState(false);

  const rounds = playoffs.reduce<Record<number, PlayoffMatchWithTeams[]>>(
    (acc, m) => {
      (acc[m.round] ??= []).push(m);
      return acc;
    },
    {},
  );

  const roundLabels: Record<number, string> = {
    1: "Round 1",
    2: playoffs.length <= 4 ? "Lower Final" : "Semi-Finals",
    3: "Grand Final",
  };

  if (playoffs.length === 0) {
    return (
      <div className="space-y-5">
        <p className="text-xs text-muted text-center">
          Generate a playoff bracket from the top teams after all round-robin
          matches are done.
        </p>

        {topN >= 6 ? <Bracket6Svg /> : <Bracket4Svg />}
        <div>
          <p className="text-xs text-muted text-center font-medium">
            Select how many top-ranked teams advance to the playoffs.
          </p>
          <div className="flex items-center justify-center gap-3">
            <label className="text-xs text-muted">Top teams:</label>
            <div className="relative">
              <select
                value={topN}
                onChange={(e) => onTopNChange(Number(e.target.value))}
                className="appearance-none text-sm font-medium bg-surface-3 border border-border rounded-lg px-3 py-1.5 pr-7 text-foreground focus:outline-none focus:ring-1 focus:ring-orange-500"
              >
                <option value={4}>4</option>
                <option value={5}>5</option>
                <option value={6}>6</option>
              </select>
              <ChevronDown className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted" />
            </div>
          </div>
        </div>

        {!allMatchesDone && (
          <p className="text-xs text-orange-400 text-center">
            Complete all tournament matches first.
          </p>
        )}

        <Button
          className="w-full"
          disabled={!allMatchesDone}
          loading={creating}
          onClick={async () => {
            setCreating(true);
            await onCreatePlayoffs(topN);
            setCreating(false);
          }}
        >
          <Trophy className="h-4 w-4" />
          Create Playoff Matches
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      {Object.entries(rounds).map(([round, matches]) => (
        <div key={round}>
          <h3 className="text-xs font-semibold uppercase tracking-wide text-orange-500 mb-2">
            {roundLabels[Number(round)] ?? `Round ${round}`}
          </h3>
          <div className="space-y-2">
            {matches.map((m) => (
              <PlayoffMatchCard
                key={m.id}
                match={m}
                onComplete={
                  m.status !== "COMPLETED" && m.homeTeamId && m.awayTeamId
                    ? () => onCompleteMatch(m)
                    : undefined
                }
              />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

function PlayoffMatchCard({
  match,
  onComplete,
}: {
  match: PlayoffMatchWithTeams;
  onComplete?: () => void;
}) {
  const isDone = match.status === "COMPLETED";
  const hasBothTeams = !!match.homeTeamId && !!match.awayTeamId;
  const homeWon = isDone && match.winnerId === match.homeTeamId;
  const awayWon = isDone && match.winnerId === match.awayTeamId;

  const homeName = match.homeTeam?.name ?? match.homeSlot;
  const awayName = match.awayTeam?.name ?? match.awaySlot;

  return (
    <Card padded={false} className="overflow-hidden">
      {isDone && (
        <div
          className={cn(
            "h-0.5",
            match.winnerId ? "bg-green-500" : "bg-orange-500",
          )}
        />
      )}
      <div className="flex items-center gap-2 p-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-2">
            {/* Home */}
            <div
              className={cn(
                "flex-1 text-right rounded-lg px-2 py-1 transition-all",
                homeWon && "bg-green-500/10 ring-1 ring-green-500/25",
              )}
            >
              <p
                className={cn(
                  "text-sm font-semibold truncate",
                  homeWon
                    ? "text-green-400"
                    : !match.homeTeamId
                      ? "text-muted italic"
                      : "text-foreground",
                )}
              >
                {homeWon && <span className="mr-1">🏆</span>}
                {homeName}
              </p>
              {isDone && (
                <span
                  className={cn(
                    "text-base font-bold tabular-nums",
                    homeWon ? "text-green-400" : "text-muted",
                  )}
                >
                  {match.homeScore ?? 0}
                </span>
              )}
            </div>

            <span className="text-muted text-xs shrink-0">
              {isDone ? "—" : "vs"}
            </span>

            {/* Away */}
            <div
              className={cn(
                "flex-1 rounded-lg px-2 py-1 transition-all",
                awayWon && "bg-green-500/10 ring-1 ring-green-500/25",
              )}
            >
              <p
                className={cn(
                  "text-sm font-semibold truncate",
                  awayWon
                    ? "text-green-400"
                    : !match.awayTeamId
                      ? "text-muted italic"
                      : "text-foreground",
                )}
              >
                {awayName}
                {awayWon && <span className="ml-1">🏆</span>}
              </p>
              {isDone && (
                <span
                  className={cn(
                    "text-base font-bold tabular-nums",
                    awayWon ? "text-green-400" : "text-muted",
                  )}
                >
                  {match.awayScore ?? 0}
                </span>
              )}
            </div>
          </div>
        </div>

        {onComplete && hasBothTeams && (
          <Button size="sm" variant="blue" onClick={onComplete}>
            Done
          </Button>
        )}
        {!hasBothTeams && !isDone && (
          <span className="text-[10px] text-muted italic shrink-0">TBD</span>
        )}
      </div>
    </Card>
  );
}

// ── Complete Playoff Match Modal ──────────────────────────────────────────────

function CompletePlayoffMatchModal({
  match,
  onClose,
  onComplete,
}: {
  match: PlayoffMatchWithTeams;
  onClose: () => void;
  onComplete: (
    matchId: string,
    winnerId: string,
    homeScore: number,
    awayScore: number,
  ) => void;
}) {
  const [winnerId, setWinnerId] = useState<string>("");
  const [winnerScore, setWinnerScore] = useState(21);
  const [loserScore, setLoserScore] = useState(15);
  const [loading, setLoading] = useState(false);

  const homeTeamId = match.homeTeamId!;
  const awayTeamId = match.awayTeamId!;
  const homeIsWinner = winnerId === homeTeamId;
  const awayIsWinner = winnerId === awayTeamId;
  const homeScore = homeIsWinner ? winnerScore : awayIsWinner ? loserScore : 0;
  const awayScore = awayIsWinner ? winnerScore : homeIsWinner ? loserScore : 0;
  const scoreDiff = winnerScore - loserScore;
  const validGap = scoreDiff >= 2;

  async function handleSubmit() {
    if (!winnerId || !validGap) return;
    setLoading(true);
    await onComplete(match.id, winnerId, homeScore, awayScore);
    setLoading(false);
  }

  return (
    <Modal open onClose={onClose} title="Complete Playoff Match">
      <div className="space-y-4">
        <p className="text-sm text-[var(--color-muted)]">
          Select the winning team.
        </p>

        <div className="grid grid-cols-2 gap-3">
          {[
            { team: match.homeTeam!, id: homeTeamId },
            { team: match.awayTeam!, id: awayTeamId },
          ].map(({ team, id }) => (
            <button
              key={id}
              onClick={() => setWinnerId(id)}
              className={cn(
                "rounded-xl p-3 border-2 transition-all text-left",
                winnerId === id
                  ? "border-orange-500 bg-orange-50 dark:bg-orange-900/20"
                  : "border-[var(--color-border)] hover:border-orange-300",
              )}
            >
              <div className="flex items-center gap-1.5 flex-wrap">
                {team.members.map(
                  (m: {
                    player: { id: string; name: string; avatarUrl?: string };
                  }) => (
                    <Avatar
                      key={m.player.id}
                      name={m.player.name}
                      src={m.player.avatarUrl}
                      size="xs"
                    />
                  ),
                )}
              </div>
              <p className="text-sm font-semibold text-[var(--color-foreground)] mt-2">
                {team.name}
              </p>
              {winnerId === id && (
                <div className="flex items-center gap-1 mt-1">
                  <Trophy className="h-3 w-3 text-orange-500" />
                  <span className="text-xs text-orange-500 font-semibold">
                    Winner
                  </span>
                </div>
              )}
            </button>
          ))}
        </div>

        {winnerId && (
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label
                className={cn(
                  "text-xs font-medium block mb-2 text-center",
                  homeIsWinner
                    ? "text-orange-500"
                    : "text-[var(--color-muted)]",
                )}
              >
                {homeIsWinner ? "Winner (21–30)" : "Loser (0–30)"}
              </label>
              <ScoreScroller
                value={homeIsWinner ? winnerScore : loserScore}
                onChange={homeIsWinner ? setWinnerScore : setLoserScore}
                min={homeIsWinner ? 21 : 0}
                max={30}
              />
            </div>
            <div>
              <label
                className={cn(
                  "text-xs font-medium block mb-2 text-center",
                  awayIsWinner
                    ? "text-orange-500"
                    : "text-[var(--color-muted)]",
                )}
              >
                {awayIsWinner ? "Winner (21–30)" : "Loser (0–30)"}
              </label>
              <ScoreScroller
                value={awayIsWinner ? winnerScore : loserScore}
                onChange={awayIsWinner ? setWinnerScore : setLoserScore}
                min={awayIsWinner ? 21 : 0}
                max={30}
              />
            </div>
          </div>
        )}

        {winnerId && (
          <div className="flex items-center justify-center gap-4 py-2 rounded-xl bg-[var(--color-surface-3)]">
            <div className="text-center">
              <p className="text-xs text-[var(--color-muted)] truncate">
                {match.homeTeam!.name}
              </p>
              <p
                className={cn(
                  "text-2xl font-bold",
                  homeIsWinner
                    ? "text-orange-500"
                    : "text-[var(--color-foreground)]",
                )}
              >
                {homeScore}
              </p>
            </div>
            <span className="text-[var(--color-muted)]">—</span>
            <div className="text-center">
              <p className="text-xs text-[var(--color-muted)] truncate">
                {match.awayTeam!.name}
              </p>
              <p
                className={cn(
                  "text-2xl font-bold",
                  awayIsWinner
                    ? "text-orange-500"
                    : "text-[var(--color-foreground)]",
                )}
              >
                {awayScore}
              </p>
            </div>
          </div>
        )}

        {winnerId && !validGap && (
          <p className="text-xs text-red-500 text-center -mb-1">
            Winning score must be at least 2 points ahead.
          </p>
        )}

        <Button
          className="w-full"
          onClick={handleSubmit}
          loading={loading}
          disabled={!winnerId || !validGap}
        >
          Save Result
        </Button>
      </div>
    </Modal>
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
            <h3 className="font-semibold text-sm text-[var(--color-foreground)]">
              {team.name}
            </h3>
          </div>
          <div className="space-y-2">
            {team.members.map((member) => (
              <div key={member.player.id} className="flex items-center gap-2">
                <Avatar
                  name={member.player.name}
                  src={member.player.avatarUrl}
                  size="sm"
                />
                <span className="text-sm text-[var(--color-foreground)]">
                  {member.player.name}
                </span>
              </div>
            ))}
          </div>
        </Card>
      ))}
    </div>
  );
}
