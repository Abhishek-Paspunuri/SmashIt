import { cn } from "@/lib/utils";
import type { TournamentStatus, MatchStatus, PlayerStatus } from "@prisma/client";

type BadgeVariant = "default" | "success" | "warning" | "danger" | "info" | "orange" | "muted";

interface BadgeProps {
  variant?: BadgeVariant;
  className?: string;
  children: React.ReactNode;
}

const variantClasses: Record<BadgeVariant, string> = {
  default: "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300",
  success: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400",
  warning: "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400",
  danger: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400",
  info: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
  orange: "bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400",
  muted: "bg-[var(--color-surface-3)] text-[var(--color-muted)]",
};

export function Badge({ variant = "default", className, children }: BadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium",
        variantClasses[variant],
        className
      )}
    >
      {children}
    </span>
  );
}

export function TournamentStatusBadge({ status }: { status: TournamentStatus }) {
  const map: Record<TournamentStatus, { label: string; variant: BadgeVariant }> = {
    DRAFT: { label: "Draft", variant: "muted" },
    SCHEDULED: { label: "Scheduled", variant: "info" },
    LIVE: { label: "Live", variant: "orange" },
    COMPLETED: { label: "Completed", variant: "success" },
    ARCHIVED: { label: "Archived", variant: "default" },
  };
  const { label, variant } = map[status];
  return <Badge variant={variant}>{label}</Badge>;
}

export function MatchStatusBadge({ status }: { status: MatchStatus }) {
  const map: Record<MatchStatus, { label: string; variant: BadgeVariant }> = {
    UPCOMING: { label: "Upcoming", variant: "info" },
    LIVE: { label: "Live", variant: "orange" },
    COMPLETED: { label: "Completed", variant: "success" },
  };
  const { label, variant } = map[status];
  return <Badge variant={variant}>{label}</Badge>;
}

export function PlayerStatusBadge({ status }: { status: PlayerStatus }) {
  const map: Record<PlayerStatus, { label: string; variant: BadgeVariant }> = {
    INVITED: { label: "Invited", variant: "warning" },
    ACTIVE: { label: "Active", variant: "success" },
    INACTIVE: { label: "Inactive", variant: "muted" },
  };
  const { label, variant } = map[status];
  return <Badge variant={variant}>{label}</Badge>;
}
