"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { Card, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { TournamentStatusBadge } from "@/components/ui/badge";
import {
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
import HelloImage from "@/public/hii.png";

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
  {
    label: "Create Tournament",
    href: "/tournaments/new",
    icon: Trophy,
    color: "orange",
  },
  { label: "Add Player", href: "/players", icon: Users, color: "blue" },
  { label: "Create Group", href: "/groups", icon: FolderOpen, color: "green" },
  {
    label: "View Matches",
    href: "/tournaments",
    icon: Swords,
    color: "purple",
  },
] as const;

export function DashboardClient({ user, stats }: DashboardClientProps) {
  const router = useRouter();

  const actionColors = {
    orange:
      "bg-orange-100 dark:bg-orange-900/20 text-orange-600 dark:text-orange-400",
    blue: "bg-blue-100 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400",
    green:
      "bg-green-100 dark:bg-green-900/20 text-green-600 dark:text-green-400",
    purple:
      "bg-purple-100 dark:bg-purple-900/20 text-purple-600 dark:text-purple-400",
  };

  return (
    <div className="max-w-2xl mx-auto px-4 py-5 space-y-5">
      {/* Greeting */}
      <div className="flex items-center justify-between animate-fade-in-up">
        <div>
          <p className="text-sm text-muted">Welcome back,</p>
          <h1 className="text-xl font-bold text-foreground">
            {user.name ?? user.email.split("@")[0]}
          </h1>
        </div>
        <img src={HelloImage.src} className="w-12" />
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 animate-fade-in-up delay-75">
        <StatCard
          label="Players"
          value={stats.totalPlayers}
          icon={Users}
          href="/players"
        />
        <StatCard
          label="Groups"
          value={stats.totalGroups}
          icon={FolderOpen}
          href="/groups"
        />
        <StatCard
          label="Active Tournaments"
          value={stats.activeTournaments}
          icon={Play}
          href="/tournaments"
          accent
        />
        <StatCard
          label="Completed"
          value={stats.completedTournaments}
          icon={Trophy}
          href="/tournaments"
        />
        <StatCard
          label="Matches Played"
          value={stats.matchesPlayed}
          icon={Swords}
          href="/tournaments"
        />
      </div>

      {/* Quick actions */}
      <Card className="animate-fade-in-up delay-150">
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
        </CardHeader>
        <div className="grid grid-cols-2 gap-2">
          {QUICK_ACTIONS.map((action) => (
            <Link
              key={action.href}
              href={action.href}
              className="flex items-center gap-3 p-3 rounded-xl border border-border hover:bg-surface-3 transition-all duration-150 hover:-translate-y-px hover:shadow-sm active:scale-95"
            >
              <div
                className={cn(
                  "h-8 w-8 rounded-lg flex items-center justify-center shrink-0",
                  actionColors[action.color],
                )}
              >
                <action.icon className="h-4 w-4" />
              </div>
              <span className="text-sm font-medium text-foreground leading-tight">
                {action.label}
              </span>
            </Link>
          ))}
        </div>
      </Card>

      {/* Recent matches */}
      {stats.recentMatches.length > 0 && (
        <Card className="animate-fade-in-up delay-150">
          <CardHeader>
            <CardTitle>
              <span className="flex items-center gap-2">
                <Swords className="h-4 w-4 text-orange-500" />
                Recent Matches
              </span>
            </CardTitle>
            <Link
              href="/tournaments"
              className="text-xs text-orange-500 hover:underline"
            >
              See all
            </Link>
          </CardHeader>
          <div className="space-y-2">
            {stats.recentMatches.slice(0, 4).map((match) => (
              <Link
                key={match.id}
                href={`/tournaments/${match.tournament.id}`}
                className="flex items-center justify-between p-2.5 rounded-xl hover:bg-surface-3 transition-all duration-150 active:scale-95 group"
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span
                      className={cn(
                        "text-sm font-medium truncate max-w-20",
                        match.winnerId === match.homeTeamId
                          ? "text-orange-500"
                          : "text-foreground",
                      )}
                    >
                      {match.homeTeam.name}
                    </span>
                    <span className="text-xs text-muted font-bold shrink-0">
                      {match.homeScore} — {match.awayScore}
                    </span>
                    <span
                      className={cn(
                        "text-sm font-medium truncate max-w-20",
                        match.winnerId === match.awayTeamId
                          ? "text-orange-500"
                          : "text-foreground",
                      )}
                    >
                      {match.awayTeam.name}
                    </span>
                  </div>
                  <p className="text-[10px] text-muted mt-0.5 truncate">
                    {match.tournament.name} ·{" "}
                    {match.completedAt ? formatDateTime(match.completedAt) : ""}
                  </p>
                </div>
                <ChevronRight className="h-3.5 w-3.5 text-muted shrink-0 ml-2 opacity-0 group-hover:opacity-100 transition-opacity" />
              </Link>
            ))}
          </div>
        </Card>
      )}

      {/* Recent activity */}
      {stats.recentActivity.length > 0 && (
        <Card className="animate-fade-in-up delay-300">
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
                  <p className="text-xs text-foreground">
                    {formatAction(log.action)}
                  </p>
                  <p className="text-[10px] text-muted">
                    {formatDateTime(log.createdAt)}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Empty state */}
      {stats.totalPlayers === 0 &&
        stats.totalGroups === 0 &&
        stats.activeTournaments === 0 && (
          <div className="text-center py-8 animate-fade-in-up">
            <p className="text-2xl mb-3">🏸</p>
            <h3 className="text-base font-semibold text-foreground mb-1">
              Ready to smash?
            </h3>
            <p className="text-sm text-muted mb-4">
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

function StatCard({
  label,
  value,
  icon: Icon,
  href,
  accent,
}: {
  label: string;
  value: number;
  icon: typeof Users;
  href: string;
  accent?: boolean;
}) {
  return (
    <Link href={href}>
      <Card
        lift
        className={cn(
          "flex flex-col gap-1 cursor-pointer",
          accent && "border-orange-200 dark:border-orange-800/50",
        )}
      >
        <div className="flex items-center justify-between">
          <Icon
            className={cn("h-4 w-4", accent ? "text-orange-500" : "text-muted")}
          />
        </div>
        <p
          className={cn(
            "text-2xl font-bold",
            accent ? "text-orange-500" : "text-foreground",
          )}
        >
          {value}
        </p>
        <p className="text-xs text-muted leading-tight">{label}</p>
      </Card>
    </Link>
  );
}

// ── Animated wave character ──────────────────────────────────────────────────
function WaveCharacter() {
  return (
    <div
      className="shrink-0 select-none"
      style={{ animation: "bob 2.8s ease-in-out infinite" }}
      aria-hidden="true"
    >
      <svg
        width="52"
        height="52"
        viewBox="0 0 52 52"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        {/* Head */}
        <circle cx="26" cy="13" r="10" fill="#f97316" />
        {/* Eyes */}
        <circle cx="22.5" cy="12" r="1.8" fill="white" />
        <circle cx="29.5" cy="12" r="1.8" fill="white" />
        <circle cx="23" cy="12.4" r="0.9" fill="#111" />
        <circle cx="30" cy="12.4" r="0.9" fill="#111" />
        {/* Smile */}
        <path
          d="M21.5 16 Q26 20 30.5 16"
          stroke="white"
          strokeWidth="1.4"
          fill="none"
          strokeLinecap="round"
        />
        {/* Cheeks */}
        <circle cx="20" cy="15.5" r="2.5" fill="#ff8c38" opacity="0.45" />
        <circle cx="32" cy="15.5" r="2.5" fill="#ff8c38" opacity="0.45" />
        {/* Body */}
        <rect x="20" y="23" width="12" height="14" rx="5" fill="#fb923c" />
        {/* Waving right arm */}
        <g
          style={{
            transformOrigin: "32px 26px",
            animation: "wave-hand 1.4s ease-in-out infinite",
          }}
        >
          <line
            x1="32"
            y1="26"
            x2="43"
            y2="20"
            stroke="#f97316"
            strokeWidth="3.5"
            strokeLinecap="round"
          />
          <circle cx="44" cy="19" r="3.5" fill="#f97316" />
        </g>
        {/* Left arm (static) */}
        <line
          x1="20"
          y1="26"
          x2="11"
          y2="31"
          stroke="#fb923c"
          strokeWidth="3.5"
          strokeLinecap="round"
        />
        <circle cx="10" cy="32" r="3.5" fill="#fb923c" />
        {/* Legs */}
        <line
          x1="23"
          y1="37"
          x2="21"
          y2="47"
          stroke="#fb923c"
          strokeWidth="3.5"
          strokeLinecap="round"
        />
        <line
          x1="29"
          y1="37"
          x2="31"
          y2="47"
          stroke="#fb923c"
          strokeWidth="3.5"
          strokeLinecap="round"
        />
        {/* Shoes */}
        <rect x="18" y="45" width="6" height="3" rx="1.5" fill="#ea580c" />
        <rect x="28" y="45" width="6" height="3" rx="1.5" fill="#ea580c" />
      </svg>
    </div>
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
