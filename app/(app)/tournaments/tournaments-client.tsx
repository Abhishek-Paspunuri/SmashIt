"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { TournamentStatusBadge } from "@/components/ui/badge";
import { EmptyState } from "@/components/ui/empty-state";
import { Plus, Trophy, Users, Swords, ChevronRight, Star, Loader2 } from "lucide-react";
import type { Tournament, Group } from "@prisma/client";
import { formatDate, cn } from "@/lib/utils";

type TournamentOwner = { id: string; name: string | null; orgName: string | null; email: string };

type TournamentWithCounts = Tournament & {
  _count: { matches: number; teams: number; participants: number };
  sourceGroup: Group | null;
  owner: TournamentOwner;
  winnerTeamName: string | null;
};

interface TournamentsClientProps {
  initialTournaments: TournamentWithCounts[];
  currentUserId: string;
}

const STATUS_FILTERS = [
  { label: "All", value: "ALL" },
  { label: "Live", value: "LIVE" },
  { label: "Scheduled", value: "SCHEDULED" },
  { label: "Completed", value: "COMPLETED" },
  { label: "Draft", value: "DRAFT" },
] as const;

export function TournamentsClient({ initialTournaments, currentUserId }: TournamentsClientProps) {
  const router = useRouter();
  const [filter, setFilter] = useState<string>("ALL");
  const [loadingId, setLoadingId] = useState<string | null>(null);

  const filtered = filter === "ALL"
    ? initialTournaments
    : initialTournaments.filter((t) => t.status === filter);

  return (
    <div className="max-w-2xl mx-auto px-4 py-5">
      {/* Header */}
      <div className="flex items-center justify-between mb-5">
        <div>
          <h1 className="text-xl font-bold text-foreground">Tournaments</h1>
          <p className="text-sm text-muted">{initialTournaments.length} total</p>
        </div>
        <Button onClick={() => router.push("/tournaments/new")} size="sm">
          <Plus className="h-4 w-4" />
          New
        </Button>
      </div>

      {/* Filter tabs */}
      <div className="flex gap-2 overflow-x-auto pb-2 mb-4">
        {STATUS_FILTERS.map((f) => (
          <button
            key={f.value}
            onClick={() => setFilter(f.value)}
            className={cn(
              "shrink-0 px-3 py-1.5 rounded-full text-xs font-medium transition-colors",
              filter === f.value
                ? "bg-orange-500 text-white"
                : "bg-surface-3 text-muted hover:text-foreground"
            )}
          >
            {f.label}
          </button>
        ))}
      </div>

      {/* List */}
      {filtered.length === 0 ? (
        <EmptyState
          icon={Trophy}
          title="No tournaments yet"
          description="Create your first tournament and start playing!"
          action={{ label: "Create Tournament", onClick: () => router.push("/tournaments/new") }}
        />
      ) : (
        <div className="space-y-2">
          {filtered.map((t) => {
            const isOwner = t.ownerId === currentUserId;
            const hostedBy = isOwner
              ? null
              : t.owner.orgName ?? t.owner.name ?? t.owner.email.split("@")[0];
            const isCompleted = t.status === "COMPLETED";
            return (
              <div key={t.id} className="space-y-0">
              <Card
                padded={false}
                className={cn(
                  "p-4 cursor-pointer hover:bg-surface-2 transition-colors relative",
                  isCompleted && t.winnerTeamName ? "rounded-b-none border-b-0" : ""
                )}
                onClick={() => { setLoadingId(t.id); router.push(`/tournaments/${t.id}`); }}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-start gap-3 flex-1 min-w-0">
                    <div className={cn(
                      "h-10 w-10 rounded-xl flex items-center justify-center shrink-0",
                      isOwner
                        ? "bg-orange-100 dark:bg-orange-900/20"
                        : "bg-blue-100 dark:bg-blue-900/20"
                    )}>
                      <Trophy className={cn("h-5 w-5", isOwner ? "text-orange-500" : "text-blue-500")} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h3 className="font-semibold text-sm text-foreground truncate">
                          {t.name}
                        </h3>
                        <TournamentStatusBadge status={t.status} />
                        {/* Self / External badge */}
                        {isOwner ? (
                          <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded-full bg-purple-100 dark:bg-purple-900/20 text-purple-600 dark:text-purple-400">
                            Self
                          </span>
                        ) : (
                          <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded-full bg-blue-100 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400">
                            by {hostedBy}
                          </span>
                        )}
                      </div>
                      {t.description && (
                        <p className="text-xs text-muted mt-0.5 truncate">{t.description}</p>
                      )}
                      <div className="flex items-center gap-4 mt-2">
                        <span className="text-xs text-muted flex items-center gap-1">
                          <Users className="h-3 w-3" />
                          {t._count.teams} teams
                        </span>
                        <span className="text-xs text-muted flex items-center gap-1">
                          <Swords className="h-3 w-3" />
                          {t._count.matches} matches
                        </span>
                        {t.startDate && (
                          <span className="text-xs text-muted">
                            {formatDate(t.startDate)}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                  {loadingId === t.id ? (
                    <Loader2 className="h-4 w-4 text-orange-500 shrink-0 mt-1 animate-spin" />
                  ) : (
                    <ChevronRight className="h-4 w-4 text-muted shrink-0 mt-1" />
                  )}
                </div>
              </Card>

              {/* Winner banner for completed tournaments */}
              {isCompleted && t.winnerTeamName && (
                <div
                  className="cursor-pointer rounded-b-2xl border border-t-0 border-purple-500/30 bg-gradient-to-r from-purple-900/40 via-purple-800/25 to-purple-900/40 px-4 py-2.5 flex items-center gap-2.5"
                  onClick={() => router.push(`/tournaments/${t.id}`)}
                >
                  <div className="flex items-center justify-center h-7 w-7 rounded-full bg-purple-500/20 shrink-0">
                    <Star className="h-3.5 w-3.5 text-purple-400 fill-purple-400" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-[10px] font-semibold uppercase tracking-widest text-purple-400/80">
                      Tournament Champion
                    </p>
                    <p className="text-sm font-bold text-purple-200 truncate">
                      🎉 {t.winnerTeamName}
                    </p>
                  </div>
                  <span className="text-lg shrink-0">🏆</span>
                </div>
              )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
