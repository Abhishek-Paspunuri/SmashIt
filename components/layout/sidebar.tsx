"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Home,
  Users,
  Trophy,
  BarChart2,
  FolderOpen,
  LogOut,
  Sun,
  Moon,
} from "lucide-react";
import { SmashLogo } from "@/components/ui/smash-logo";
import { cn } from "@/lib/utils";
import { Avatar } from "@/components/ui/avatar";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import type { User } from "@prisma/client";
import { useTheme } from "@/components/theme-provider";

const NAV_ITEMS = [
  { label: "Dashboard", href: "/dashboard", icon: Home },
  { label: "Players", href: "/players", icon: Users },
  { label: "Groups", href: "/groups", icon: FolderOpen },
  { label: "Tournaments", href: "/tournaments", icon: Trophy },
  { label: "Analytics", href: "/analytics", icon: BarChart2 },
];

interface SidebarProps {
  user: User;
}

export function Sidebar({ user }: SidebarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const supabase = createClient();
  const { theme, toggle } = useTheme();

  async function handleLogout() {
    await supabase.auth.signOut();
    router.push("/login");
    router.refresh();
  }

  return (
    <aside className="hidden sm:flex flex-col w-60 shrink-0 min-h-dvh border-r border-[var(--color-border)] bg-[var(--color-surface)] sticky top-0">
      {/* Logo */}
      <div className="flex items-center gap-3 px-5 py-5 border-b border-[var(--color-border)]">
        <div className="h-9 w-9 rounded-xl overflow-hidden shrink-0 shadow-sm shadow-orange-500/30">
          <SmashLogo size={36} />
        </div>
        <span className="text-lg font-bold text-[var(--color-foreground)]">
          Smash
        </span>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-3 space-y-0.5">
        {NAV_ITEMS.map(({ label, href, icon: Icon }) => {
          const isActive = pathname === href || pathname.startsWith(href + "/");
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                "relative flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium",
                "transition-all duration-150",
                isActive
                  ? "bg-orange-50 text-orange-600 shadow-sm dark:bg-orange-900/20 dark:text-orange-400"
                  : "text-[var(--color-muted)] hover:bg-[var(--color-surface-3)] hover:text-[var(--color-foreground)] hover:translate-x-0.5",
              )}
            >
              {isActive && (
                <span className="nav-pill-indicator absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-5 rounded-full bg-orange-500" />
              )}
              <Icon
                className={cn("h-4.5 w-4.5 shrink-0 transition-transform duration-150", isActive && "scale-110")}
                strokeWidth={isActive ? 2.5 : 2}
              />
              {label}
            </Link>
          );
        })}
      </nav>

      {/* User profile — clicking avatar goes to /organisation */}
      <div className="p-3 border-t border-[var(--color-border)]">
        <div className="flex items-center gap-3 px-2 py-2 rounded-lg">
          <Link href="/organisation" className="shrink-0">
            <Avatar
              name={user.name ?? user.email}
              src={user.avatarUrl}
              size="sm"
            />
          </Link>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-[var(--color-foreground)] truncate">
              {user.name ?? "User"}
            </p>
            <p className="text-xs text-[var(--color-muted)] truncate">
              {user.email}
            </p>
          </div>
          <button
            onClick={toggle}
            className="p-1.5 rounded-lg text-[var(--color-muted)] hover:bg-[var(--color-surface-3)] transition-colors"
            title="Toggle theme"
          >
            {theme === "dark" ? (
              <Sun className="h-4 w-4" />
            ) : (
              <Moon className="h-4 w-4" />
            )}
          </button>
          <button
            onClick={handleLogout}
            className="p-1.5 rounded-lg text-[var(--color-muted)] hover:bg-[var(--color-surface-3)] hover:text-red-500 transition-colors"
            title="Sign out"
          >
            <LogOut className="h-4 w-4" />
          </button>
        </div>
      </div>
    </aside>
  );
}
