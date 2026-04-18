import { cn } from "@/lib/utils";
import type { LucideIcon } from "lucide-react";
import { Button } from "./button";

interface EmptyStateProps {
  icon: LucideIcon;
  title: string;
  description: string;
  action?: {
    label: string;
    onClick: () => void;
  };
  className?: string;
}

export function EmptyState({ icon: Icon, title, description, action, className }: EmptyStateProps) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center text-center py-16 px-4",
        className
      )}
    >
      <div className="rounded-full bg-orange-100 dark:bg-orange-900/20 p-4 mb-4">
        <Icon className="h-8 w-8 text-orange-500" />
      </div>
      <h3 className="text-base font-semibold text-[var(--color-foreground)] mb-1">{title}</h3>
      <p className="text-sm text-[var(--color-muted)] mb-6 max-w-xs">{description}</p>
      {action && (
        <Button onClick={action.onClick} size="md">
          {action.label}
        </Button>
      )}
    </div>
  );
}
