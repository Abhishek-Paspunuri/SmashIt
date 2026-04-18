"use client";

import { Card, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  LineChart,
  Line,
  CartesianGrid,
} from "recharts";
import { Trophy, Users, Swords, TrendingUp } from "lucide-react";

interface AnalyticsData {
  totalTournaments: number;
  tournamentsByStatus: { status: string; count: number }[];
  totalPlayers: number;
  totalMatches: number;
  teamWinRates: ({
    teamId: string;
    teamName: string;
    tournamentName: string;
    wins: number;
    losses: number;
    winRate: number;
  } | null)[];
  matchesByDay: { date: string; count: number }[];
}

export function AnalyticsClient({ data }: { data: AnalyticsData }) {
  const activeTournaments =
    data.tournamentsByStatus.find((t) => t.status === "LIVE")?.count ?? 0;
  const completedTournaments =
    data.tournamentsByStatus.find((t) => t.status === "COMPLETED")?.count ?? 0;

  const chartColors = {
    orange: "#f97316",
    orangeLight: "#fb923c",
    muted: "#9ca3af",
  };

  const validWinRates = data.teamWinRates.filter(Boolean) as NonNullable<
    (typeof data.teamWinRates)[0]
  >[];

  return (
    <div className="max-w-2xl mx-auto px-4 py-5 space-y-5">
      <div>
        <h1 className="text-xl font-bold text-[var(--color-foreground)]">
          Analytics
        </h1>
        <p className="text-sm text-[var(--color-muted)]">
          Your badminton stats at a glance.
        </p>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <StatCard
          icon={Trophy}
          label="Total Tournaments"
          value={data.totalTournaments}
          color="orange"
        />
        <StatCard
          icon={Swords}
          label="Active"
          value={activeTournaments}
          color="orange"
        />
        <StatCard
          icon={Trophy}
          label="Completed"
          value={completedTournaments}
          color="green"
        />
        <StatCard
          icon={Users}
          label="Players"
          value={data.totalPlayers}
          color="blue"
        />
      </div>

      {/* Total matches */}
      <Card>
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-[var(--color-muted)]">
              Total Matches Played
            </p>
            <p className="text-3xl font-bold text-[var(--color-foreground)]">
              {data.totalMatches}
            </p>
          </div>
          <div className="h-12 w-12 rounded-xl bg-orange-100 dark:bg-orange-900/20 flex items-center justify-center">
            <Swords className="h-6 w-6 text-orange-500" />
          </div>
        </div>
      </Card>

      {/* Tournaments by status */}
      {data.tournamentsByStatus.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Tournaments by Status</CardTitle>
          </CardHeader>
          <ResponsiveContainer width="100%" height={160}>
            <BarChart
              data={data.tournamentsByStatus}
              margin={{ top: 0, right: 0, bottom: 0, left: -20 }}
            >
              <XAxis
                dataKey="status"
                tick={{ fontSize: 10, fill: chartColors.muted }}
              />
              <YAxis
                tick={{ fontSize: 10, fill: chartColors.muted }}
                allowDecimals={false}
              />
              <Tooltip
                contentStyle={{
                  background: "var(--color-surface)",
                  border: "1px solid var(--color-border)",
                  borderRadius: 8,
                  fontSize: 12,
                }}
              />
              <Bar
                dataKey="count"
                fill={chartColors.orange}
                radius={[4, 4, 0, 0]}
              />
            </BarChart>
          </ResponsiveContainer>
        </Card>
      )}

      {/* Match activity over time */}
      {data.matchesByDay.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>
              <span className="flex items-center gap-2">
                <TrendingUp className="h-4 w-4 text-orange-500" />
                Match Activity (Last 30 Days)
              </span>
            </CardTitle>
          </CardHeader>
          <ResponsiveContainer width="100%" height={160}>
            <LineChart
              data={data.matchesByDay}
              margin={{ top: 4, right: 4, bottom: 0, left: -20 }}
            >
              <CartesianGrid
                strokeDasharray="3 3"
                stroke="var(--color-border)"
              />
              <XAxis
                dataKey="date"
                tick={{ fontSize: 9, fill: chartColors.muted }}
                tickFormatter={(v) => v.slice(5)} // MM-DD
              />
              <YAxis
                tick={{ fontSize: 10, fill: chartColors.muted }}
                allowDecimals={false}
              />
              <Tooltip
                contentStyle={{
                  background: "var(--color-surface)",
                  border: "1px solid var(--color-border)",
                  borderRadius: 8,
                  fontSize: 12,
                }}
              />
              <Line
                type="monotone"
                dataKey="count"
                stroke={chartColors.orange}
                strokeWidth={2}
                dot={{ fill: chartColors.orange, r: 3 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </Card>
      )}

      {/* Win rates */}
      {validWinRates.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Top Teams by Win Rate</CardTitle>
          </CardHeader>
          <div className="space-y-3">
            {validWinRates.slice(0, 8).map((team) => (
              <div key={team.teamId} className="flex items-center gap-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm font-medium text-[var(--color-foreground)] truncate">
                      {team.teamName}
                    </span>
                    <span className="text-xs text-[var(--color-muted)] ml-2 shrink-0">
                      {team.wins}W {team.losses}L
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="flex-1 h-1.5 bg-[var(--color-surface-3)] rounded-full overflow-hidden">
                      <div
                        className="h-full bg-orange-500 rounded-full"
                        style={{ width: `${team.winRate}%` }}
                      />
                    </div>
                    <span className="text-xs font-semibold text-orange-500 w-8 text-right">
                      {team.winRate}%
                    </span>
                  </div>
                  <p className="text-[10px] text-[var(--color-muted)] mt-0.5 truncate">
                    {team.tournamentName}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}

      {validWinRates.length === 0 &&
        data.matchesByDay.length === 0 &&
        data.totalTournaments === 0 && (
          <div className="text-center py-16">
            <div className="text-4xl mb-4">📊</div>
            <h3 className="text-base font-semibold text-[var(--color-foreground)] mb-1">
              No data yet
            </h3>
            <p className="text-sm text-[var(--color-muted)]">
              Analytics will populate once you create tournaments and play
              matches.
            </p>
          </div>
        )}
    </div>
  );
}

function StatCard({
  icon: Icon,
  label,
  value,
  color,
}: {
  icon: typeof Trophy;
  label: string;
  value: number;
  color: "orange" | "green" | "blue";
}) {
  const colors = {
    orange:
      "bg-orange-100 dark:bg-orange-900/20 text-orange-600 dark:text-orange-400",
    green:
      "bg-green-100 dark:bg-green-900/20 text-green-600 dark:text-green-400",
    blue: "bg-blue-100 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400",
  };

  return (
    <Card className="flex flex-col gap-2">
      <div
        className={`h-8 w-8 rounded-lg flex items-center justify-center ${colors[color]}`}
      >
        <Icon className="h-4 w-4" />
      </div>
      <div>
        <p className="text-2xl font-bold text-[var(--color-foreground)]">
          {value}
        </p>
        <p className="text-xs text-[var(--color-muted)] leading-tight">
          {label}
        </p>
      </div>
    </Card>
  );
}
