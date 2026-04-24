"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { TournamentStatusBadge } from "@/components/ui/badge";
import { EmptyState } from "@/components/ui/empty-state";
import { Plus, Trophy, Users, Swords, ChevronRight } from "lucide-react";
import type { Tournament, Group } from "@prisma/client";
import { formatDate, cn } from "@/lib/utils";

type TournamentOwner = { id: string; name: string | null; orgName: string | null; email: string };

type TournamentWithCounts = Tournament & {
  _count: { matches: number; teams: number; participants: number };
  sourceGroup: Group | null;
  owner: TournamentOwner;
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
            return (
              <Card
                key={t.id}
                padded={false}
                className="p-4 cursor-pointer hover:bg-surface-2 transition-colors"
                onClick={() => router.push(`/tournaments/${t.id}`)}
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
                          <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded-full bg-orange-100 dark:bg-orange-900/20 text-orange-600 dark:text-orange-400">
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
                  <ChevronRight className="h-4 w-4 text-muted shrink-0 mt-1" />
                </div>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
