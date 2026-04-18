"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { TournamentStatusBadge } from "@/components/ui/badge";
import { EmptyState } from "@/components/ui/empty-state";
import { Plus, Trophy, Users, Swords, ChevronRight } from "lucide-react";
import type { Tournament, Group } from "@prisma/client";
import { formatDate } from "@/lib/utils";

type TournamentWithCounts = Tournament & {
  _count: { matches: number; teams: number; participants: number };
  sourceGroup: Group | null;
};

interface TournamentsClientProps {
  initialTournaments: TournamentWithCounts[];
}

const STATUS_FILTERS = [
  { label: "All", value: "ALL" },
  { label: "Live", value: "LIVE" },
  { label: "Scheduled", value: "SCHEDULED" },
  { label: "Completed", value: "COMPLETED" },
  { label: "Draft", value: "DRAFT" },
] as const;

export function TournamentsClient({ initialTournaments }: TournamentsClientProps) {
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
          <h1 className="text-xl font-bold text-[var(--color-foreground)]">Tournaments</h1>
          <p className="text-sm text-[var(--color-muted)]">{initialTournaments.length} total</p>
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
            className={`shrink-0 px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
              filter === f.value
                ? "bg-orange-500 text-white"
                : "bg-[var(--color-surface-3)] text-[var(--color-muted)] hover:text-[var(--color-foreground)]"
            }`}
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
          {filtered.map((t) => (
            <Card
              key={t.id}
              padded={false}
              className="p-4 cursor-pointer hover:bg-[var(--color-surface-2)] transition-colors"
              onClick={() => router.push(`/tournaments/${t.id}`)}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-start gap-3 flex-1 min-w-0">
                  <div className="h-10 w-10 rounded-xl bg-orange-100 dark:bg-orange-900/20 flex items-center justify-center shrink-0">
                    <Trophy className="h-5 w-5 text-orange-500" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="font-semibold text-sm text-[var(--color-foreground)] truncate">
                        {t.name}
                      </h3>
                      <TournamentStatusBadge status={t.status} />
                    </div>
                    {t.description && (
                      <p className="text-xs text-[var(--color-muted)] mt-0.5 truncate">{t.description}</p>
                    )}
                    <div className="flex items-center gap-4 mt-2">
                      <span className="text-xs text-[var(--color-muted)] flex items-center gap-1">
                        <Users className="h-3 w-3" />
                        {t._count.teams} teams
                      </span>
                      <span className="text-xs text-[var(--color-muted)] flex items-center gap-1">
                        <Swords className="h-3 w-3" />
                        {t._count.matches} matches
                      </span>
                      {t.startDate && (
                        <span className="text-xs text-[var(--color-muted)]">
                          {formatDate(t.startDate)}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
                <ChevronRight className="h-4 w-4 text-[var(--color-muted)] shrink-0 mt-1" />
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
