import { requireUser } from "@/lib/auth";
import { Sidebar } from "@/components/layout/sidebar";
import { BottomNav } from "@/components/layout/bottom-nav";
import { TopBar } from "@/components/layout/top-bar";
import { ParticleNetwork } from "@/components/ui/particle-network";
import { NavigationLoader } from "@/components/ui/navigation-loader";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const user = await requireUser();

  return (
    <>
      <NavigationLoader />
      <ParticleNetwork intensity="subtle" />
      <div className="relative z-2 flex min-h-dvh">
        <Sidebar user={user} />
        <div className="flex flex-col flex-1 min-w-0">
          <TopBar user={user} />
          <main className="flex-1 pb-20 sm:pb-0">
            {children}
          </main>
        </div>
        <BottomNav />
      </div>
    </>
  );
}
