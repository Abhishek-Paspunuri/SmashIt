"use client";

import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Avatar } from "@/components/ui/avatar";
import { LogOut, Bell, Sun, Moon } from "lucide-react";
import type { User } from "@prisma/client";
import { useTheme } from "@/components/theme-provider";

interface TopBarProps {
  user: User;
  title?: string;
}

export function TopBar({ user, title }: TopBarProps) {
  const router = useRouter();
  const supabase = createClient();
  const { theme, toggle } = useTheme();

  async function handleLogout() {
    await supabase.auth.signOut();
    router.push("/login");
    router.refresh();
  }

  return (
    <header className="sm:hidden sticky top-0 z-30 flex items-center justify-between px-4 h-14 border-b border-[var(--color-border)] bg-[var(--color-surface)]/95 backdrop-blur-md">
      {/* Logo/Title */}
      <div className="flex items-center gap-2">
        <div className="h-8 w-8 rounded-xl bg-orange-500 flex items-center justify-center">
          <span className="text-base">🏸</span>
        </div>
        <span className="font-bold text-[var(--color-foreground)]">
          {title ?? "Smash"}
        </span>
      </div>

      {/* Right actions */}
      <div className="flex items-center gap-1">
        <button
          onClick={toggle}
          className="p-2 rounded-lg text-[var(--color-muted)] hover:bg-[var(--color-surface-3)] transition-colors"
          aria-label="Toggle theme"
        >
          {theme === "dark" ? (
            <Sun className="h-4.5 w-4.5" />
          ) : (
            <Moon className="h-4.5 w-4.5" />
          )}
        </button>
        <button
          onClick={handleLogout}
          className="p-2 rounded-lg text-[var(--color-muted)] hover:bg-[var(--color-surface-3)] transition-colors"
        >
          <LogOut className="h-4.5 w-4.5" />
        </button>
        <Avatar name={user.name ?? user.email} src={user.avatarUrl} size="sm" />
      </div>
    </header>
  );
}
