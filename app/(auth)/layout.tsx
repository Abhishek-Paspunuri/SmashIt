import { ParticleNetwork } from "@/components/ui/particle-network";
import { BadmintonBackground } from "@/components/ui/badminton-bg";

/**
 * Auth layout — always dark regardless of user theme preference.
 * The `dark` class on the outer div forces all CSS variable dark-mode
 * overrides and Tailwind dark: variants to activate inside auth pages.
 */
export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="dark">
      <div className="relative min-h-dvh bg-[#080808] overflow-hidden">
        {/* Floating shuttlecock sparks (vivid) */}
        <BadmintonBackground intensity="vivid" />
        {/* Particle network overlay */}
        <ParticleNetwork intensity="vivid" />
        {children}
      </div>
    </div>
  );
}
