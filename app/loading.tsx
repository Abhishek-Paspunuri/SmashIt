import { BadmintonBackground } from "@/components/ui/badminton-bg";

/**
 * App-level loading screen — shown by Next.js while server components stream in.
 */
export default function Loading() {
  return (
    <div className="relative min-h-dvh flex flex-col items-center justify-center bg-[var(--color-surface)] overflow-hidden">
      <BadmintonBackground intensity="vivid" />

      {/* Pulsing rings behind the logo */}
      <div className="relative flex items-center justify-center mb-8">
        <div
          className="absolute rounded-full border-2 border-orange-400/30 animate-ring-expand"
          style={{ width: 80, height: 80 }}
        />
        <div
          className="absolute rounded-full border-2 border-orange-300/20 animate-ring-expand delay-500"
          style={{ width: 80, height: 80 }}
        />

        {/* Logo card */}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <div className="relative h-16 w-16 rounded-2xl overflow-hidden shadow-xl shadow-orange-500/20 animate-scale-bounce-in bg-[#1a1a1a]">
          <img
            src="/smashit-logo.png"
            alt="Smash"
            className="h-full w-full object-contain p-1"
          />
        </div>
      </div>

      {/* App name */}
      <h1 className="text-2xl font-bold tracking-wide text-[var(--color-foreground)] animate-fade-in-up delay-150">
        Smash It
      </h1>
      <p className="text-sm text-[var(--color-muted)] mt-1.5 animate-fade-in-up delay-300">
        Lets Hit Hard
      </p>

      {/* Spinning shuttlecock loader */}
      <div className="mt-10 animate-fade-in-up delay-500">
        <div className="animate-shuttle-spin" style={{ color: "#f97316" }}>
          <svg
            width="28"
            height="42"
            viewBox="0 0 24 36"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <ellipse cx="12" cy="32" rx="4" ry="3" fill="currentColor" />
            {[4, 7, 10, 12, 14, 17, 20].map((x2, i) => (
              <line
                key={i}
                x1="12"
                y1="29"
                x2={x2}
                y2={i < 2 || i > 4 ? 8 : i === 3 ? 3 : 5}
                stroke="currentColor"
                strokeWidth="0.8"
                strokeLinecap="round"
              />
            ))}
            <ellipse
              cx="12"
              cy="6.5"
              rx="8.5"
              ry="2.5"
              fill="none"
              stroke="currentColor"
              strokeWidth="0.8"
            />
          </svg>
        </div>
      </div>

      {/* Loading dots */}
      <div className="flex gap-1.5 mt-4 animate-fade-in-up delay-500">
        {[0, 1, 2].map((i) => (
          <span
            key={i}
            className="h-1.5 w-1.5 rounded-full bg-orange-400 animate-text-shimmer"
            style={{ animationDelay: `${i * 0.2}s` }}
          />
        ))}
      </div>
    </div>
  );
}
