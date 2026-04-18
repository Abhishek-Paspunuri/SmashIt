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
            const isActive = pathname === href || pathname.startsWith(href + "/");
            return (
              <Link
                key={href}
                href={href}
                className={cn(
                  "flex flex-col items-center justify-center gap-0.5 transition-colors",
                  isActive
                    ? "text-orange-500"
                    : "text-[var(--color-muted)] hover:text-[var(--color-foreground)]"
                )}
              >
                <Icon
                  className={cn("h-5 w-5 transition-transform", isActive && "scale-110")}
                  strokeWidth={isActive ? 2.5 : 2}
                />
                <span className={cn("text-[10px] font-medium", isActive && "font-semibold")}>
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
