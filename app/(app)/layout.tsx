import { requireUser } from "@/lib/auth";
import { Sidebar } from "@/components/layout/sidebar";
import { BottomNav } from "@/components/layout/bottom-nav";
import { TopBar } from "@/components/layout/top-bar";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const user = await requireUser();

  return (
    <div className="flex min-h-dvh bg-[var(--color-surface-2)]">
      {/* Desktop sidebar */}
      <Sidebar user={user} />

      {/* Main content */}
      <div className="flex flex-col flex-1 min-w-0">
        {/* Mobile top bar */}
        <TopBar user={user} />

        {/* Page content */}
        <main className="flex-1 pb-20 sm:pb-0">
          {children}
        </main>
      </div>

      {/* Mobile bottom nav */}
      <BottomNav />
    </div>
  );
}
