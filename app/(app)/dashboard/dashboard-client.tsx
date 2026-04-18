"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { Card, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar } from "@/components/ui/avatar";
import { TournamentStatusBadge } from "@/components/ui/badge";
import {
  Plus,
  Users,
  Trophy,
  FolderOpen,
  Swords,
  Activity,
  ChevronRight,
  Play,
} from "lucide-react";
import type { User } from "@prisma/client";
import { formatDateTime } from "@/lib/utils";
import { cn } from "@/lib/utils";

interface DashboardStats {
  totalPlayers: number;
  totalGroups: number;
  activeTournaments: number;
  completedTournaments: number;
  matchesPlayed: number;
  recentMatches: any[];
  recentActivity: any[];
}

interface DashboardClientProps {
  user: User;
  stats: DashboardStats;
}

const QUICK_ACTIONS = [
  { label: "Create Tournament", href: "/tournaments/new", icon: Trophy, color: "orange" },
  { label: "Add Player", href: "/players", icon: Users, color: "blue" },
  { label: "Create Group", href: "/groups", icon: FolderOpen, color: "green" },
  { label: "View Matches", href: "/tournaments", icon: Swords, color: "purple" },
] as const;

export function DashboardClient({ user, stats }: DashboardClientProps) {
  const router = useRouter();

  const actionColors = {
    orange: "bg-orange-100 dark:bg-orange-900/20 text-orange-600 dark:text-orange-400",
    blue: "bg-blue-100 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400",
    green: "bg-green-100 dark:bg-green-900/20 text-green-600 dark:text-green-400",
    purple: "bg-purple-100 dark:bg-purple-900/20 text-purple-600 dark:text-purple-400",
  };

  return (
    <div className="max-w-2xl mx-auto px-4 py-5 space-y-5">
      {/* Greeting */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Avatar name={user.name ?? user.email} src={user.avatarUrl} size="lg" />
          <div>
            <p className="text-sm text-[var(--color-muted)]">Welcome back,</p>
            <h1 className="text-xl font-bold text-[var(--color-foreground)]">
              {user.name ?? user.email.split("@")[0]}
            </h1>
          </div>
        </div>
        <div className="h-10 w-10 rounded-xl bg-orange-500 flex items-center justify-center shrink-0">
          <span className="text-lg">🏸</span>
        </div>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        <StatCard label="Players" value={stats.totalPlayers} icon={Users} href="/players" />
        <StatCard label="Groups" value={stats.totalGroups} icon={FolderOpen} href="/groups" />
        <StatCard label="Active Tournaments" value={stats.activeTournaments} icon={Play} href="/tournaments" accent />
        <StatCard label="Completed" value={stats.completedTournaments} icon={Trophy} href="/tournaments" />
        <StatCard label="Matches Played" value={stats.matchesPlayed} icon={Swords} href="/tournaments" />
      </div>

      {/* Quick actions */}
      <Card>
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
        </CardHeader>
        <div className="grid grid-cols-2 gap-2">
          {QUICK_ACTIONS.map((action) => (
            <Link
              key={action.href}
              href={action.href}
              className="flex items-center gap-3 p-3 rounded-xl border border-[var(--color-border)] hover:bg-[var(--color-surface-3)] transition-colors"
            >
              <div className={cn("h-8 w-8 rounded-lg flex items-center justify-center shrink-0", actionColors[action.color])}>
                <action.icon className="h-4 w-4" />
              </div>
              <span className="text-sm font-medium text-[var(--color-foreground)] leading-tight">
                {action.label}
              </span>
            </Link>
          ))}
        </div>
      </Card>

      {/* Recent matches */}
      {stats.recentMatches.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>
              <span className="flex items-center gap-2">
                <Swords className="h-4 w-4 text-orange-500" />
                Recent Matches
              </span>
            </CardTitle>
            <Link href="/tournaments" className="text-xs text-orange-500 hover:underline">
              See all
            </Link>
          </CardHeader>
          <div className="space-y-2">
            {stats.recentMatches.slice(0, 4).map((match) => (
              <Link
                key={match.id}
                href={`/tournaments/${match.tournament.id}`}
                className="flex items-center justify-between p-2.5 rounded-xl hover:bg-[var(--color-surface-3)] transition-colors group"
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className={cn("text-sm font-medium truncate max-w-[5rem]", match.winnerId === match.homeTeamId ? "text-orange-500" : "text-[var(--color-foreground)]")}>
                      {match.homeTeam.name}
                    </span>
                    <span className="text-xs text-[var(--color-muted)] font-bold shrink-0">
                      {match.homeScore} — {match.awayScore}
                    </span>
                    <span className={cn("text-sm font-medium truncate max-w-[5rem]", match.winnerId === match.awayTeamId ? "text-orange-500" : "text-[var(--color-foreground)]")}>
                      {match.awayTeam.name}
                    </span>
                  </div>
                  <p className="text-[10px] text-[var(--color-muted)] mt-0.5 truncate">
                    {match.tournament.name} · {match.completedAt ? formatDateTime(match.completedAt) : ""}
                  </p>
                </div>
                <ChevronRight className="h-3.5 w-3.5 text-[var(--color-muted)] shrink-0 ml-2 opacity-0 group-hover:opacity-100 transition-opacity" />
              </Link>
            ))}
          </div>
        </Card>
      )}

      {/* Recent activity */}
      {stats.recentActivity.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>
              <span className="flex items-center gap-2">
                <Activity className="h-4 w-4 text-orange-500" />
                Recent Activity
              </span>
            </CardTitle>
          </CardHeader>
          <div className="space-y-2">
            {stats.recentActivity.slice(0, 5).map((log) => (
              <div key={log.id} className="flex items-start gap-2.5">
                <div className="h-5 w-5 rounded-full bg-orange-100 dark:bg-orange-900/20 flex items-center justify-center shrink-0 mt-0.5">
                  <div className="h-1.5 w-1.5 rounded-full bg-orange-500" />
                </div>
                <div>
                  <p className="text-xs text-[var(--color-foreground)]">
                    {formatAction(log.action)}
                  </p>
                  <p className="text-[10px] text-[var(--color-muted)]">
                    {formatDateTime(log.createdAt)}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Empty state */}
      {stats.totalPlayers === 0 && stats.totalGroups === 0 && stats.activeTournaments === 0 && (
        <div className="text-center py-8">
          <p className="text-2xl mb-3">🏸</p>
          <h3 className="text-base font-semibold text-[var(--color-foreground)] mb-1">
            Ready to smash?
          </h3>
          <p className="text-sm text-[var(--color-muted)] mb-4">
            Start by adding players, then create a group and tournament.
          </p>
          <Button onClick={() => router.push("/players")}>
            <Users className="h-4 w-4" />
            Add Players
          </Button>
        </div>
      )}
    </div>
  );
}

function StatCard({ label, value, icon: Icon, href, accent }: {
  label: string; value: number; icon: typeof Users; href: string; accent?: boolean;
}) {
  return (
    <Link href={href}>
      <Card className={cn(
        "flex flex-col gap-1 hover:bg-[var(--color-surface-3)] transition-colors cursor-pointer",
        accent && "border-orange-200 dark:border-orange-800/50"
      )}>
        <div className="flex items-center justify-between">
          <Icon className={cn("h-4 w-4", accent ? "text-orange-500" : "text-[var(--color-muted)]")} />
        </div>
        <p className={cn("text-2xl font-bold", accent ? "text-orange-500" : "text-[var(--color-foreground)]")}>
          {value}
        </p>
        <p className="text-xs text-[var(--color-muted)] leading-tight">{label}</p>
      </Card>
    </Link>
  );
}

function formatAction(action: string): string {
  const map: Record<string, string> = {
    MATCH_COMPLETED: "Match completed",
    PLAYER_ADDED: "Player added",
    TOURNAMENT_CREATED: "Tournament created",
    GROUP_CREATED: "Group created",
  };
  return map[action] ?? action.replace(/_/g, " ").toLowerCase();
}
