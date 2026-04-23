"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, Users, Trophy, BarChart2 } from "lucide-react";
import { cn } from "@/lib/utils";

const NAV_ITEMS = [
  { label: "Home", href: "/dashboard", icon: Home },
  { label: "Players", href: "/players", icon: Users },
  { label: "Tournaments", href: "/tournaments", icon: Trophy },
  { label: "Analytics", href: "/analytics", icon: BarChart2 },
];

export function BottomNav() {
  const pathname = usePathname();

  return (
    <nav className="fixed bottom-0 inset-x-0 z-40 sm:hidden">
      <div className="border-t border-[var(--color-border)] bg-[var(--color-surface)]/95 backdrop-blur-md">
        <div className="grid grid-cols-4 h-16">
          {NAV_ITEMS.map(({ label, href, icon: Icon }) => {
            const isActive =
              pathname === href || pathname.startsWith(href + "/");
            return (
              <Link
                key={href}
                href={href}
                className={cn(
                  "relative flex flex-col items-center justify-center gap-0.5 transition-all duration-200 active:scale-90",
                  isActive
                    ? "text-orange-500"
                    : "text-[var(--color-muted)] hover:text-[var(--color-foreground)]",
                )}
              >
                {/* Active pill indicator at top */}
                {isActive && (
                  <span className="nav-pill-indicator absolute top-0 left-1/2 -translate-x-1/2 h-0.5 w-8 rounded-full bg-orange-500" />
                )}

                {/* Icon with active scale */}
                <div
                  className={cn(
                    "flex items-center justify-center rounded-xl transition-all duration-200",
                    isActive
                      ? "bg-orange-500/10 w-10 h-6 scale-105"
                      : "w-8 h-6",
                  )}
                >
                  <Icon
                    className="h-5 w-5 transition-transform duration-200"
                    strokeWidth={isActive ? 2.5 : 2}
                  />
                </div>

                <span
                  className={cn(
                    "text-[10px] font-medium transition-all duration-200",
                    isActive && "font-semibold text-orange-500",
                  )}
                >
                  {label}
                </span>
              </Link>
            );
          })}
        </div>
      </div>
      {/* Safe area padding for iOS */}
      <div className="h-safe-area-inset-bottom bg-[var(--color-surface)]/95" />
    </nav>
  );
}
