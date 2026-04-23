"use client";

/**
 * BadmintonBackground — floating shuttlecock sparks.
 * Fixed overlay, sits behind all content via z-[-1].
 * intensity: "subtle" (app shell) | "vivid" (auth pages)
 */

interface Particle {
  id: number;
  x: number;       // left %
  delay: number;   // s
  duration: number;// s
  size: number;    // px
  drift: number;   // px horizontal
  rotate: number;  // deg final rotation
  opacity: number;
  type: "spark" | "shuttle";
}

const PARTICLES: Particle[] = [
  { id: 1,  x: 4,  delay: 0,    duration: 13, size: 7,  drift: 28,  rotate: 160, opacity: 0.55, type: "spark"   },
  { id: 2,  x: 9,  delay: 3.2,  duration: 19, size: 18, drift: -22, rotate: 270, opacity: 0.22, type: "shuttle" },
  { id: 3,  x: 16, delay: 1.4,  duration: 11, size: 8,  drift: 35,  rotate: 200, opacity: 0.45, type: "spark"   },
  { id: 4,  x: 23, delay: 5.8,  duration: 16, size: 10, drift: -28, rotate: 140, opacity: 0.40, type: "spark"   },
  { id: 5,  x: 30, delay: 2.1,  duration: 14, size: 22, drift: 18,  rotate: 320, opacity: 0.16, type: "shuttle" },
  { id: 6,  x: 37, delay: 7.5,  duration: 12, size: 6,  drift: -32, rotate: 180, opacity: 0.55, type: "spark"   },
  { id: 7,  x: 44, delay: 0.8,  duration: 20, size: 16, drift: 14,  rotate: 260, opacity: 0.20, type: "shuttle" },
  { id: 8,  x: 49, delay: 4.3,  duration: 10, size: 5,  drift: 40,  rotate: 120, opacity: 0.60, type: "spark"   },
  { id: 9,  x: 56, delay: 6.1,  duration: 17, size: 9,  drift: -24, rotate: 190, opacity: 0.42, type: "spark"   },
  { id: 10, x: 63, delay: 1.7,  duration: 13, size: 20, drift: 26,  rotate: 300, opacity: 0.17, type: "shuttle" },
  { id: 11, x: 69, delay: 3.9,  duration: 11, size: 7,  drift: -38, rotate: 150, opacity: 0.52, type: "spark"   },
  { id: 12, x: 74, delay: 8.2,  duration: 15, size: 11, drift: 22,  rotate: 220, opacity: 0.38, type: "spark"   },
  { id: 13, x: 81, delay: 2.6,  duration: 18, size: 24, drift: -16, rotate: 280, opacity: 0.14, type: "shuttle" },
  { id: 14, x: 86, delay: 5.4,  duration: 12, size: 6,  drift: 32,  rotate: 170, opacity: 0.48, type: "spark"   },
  { id: 15, x: 91, delay: 1.1,  duration: 14, size: 8,  drift: -26, rotate: 240, opacity: 0.50, type: "spark"   },
  { id: 16, x: 96, delay: 4.7,  duration: 11, size: 12, drift: 18,  rotate: 130, opacity: 0.34, type: "spark"   },
  { id: 17, x: 11, delay: 9.3,  duration: 21, size: 5,  drift: -44, rotate: 360, opacity: 0.58, type: "spark"   },
  { id: 18, x: 47, delay: 7.8,  duration: 13, size: 17, drift: 36,  rotate: 290, opacity: 0.18, type: "shuttle" },
  { id: 19, x: 71, delay: 11.0, duration: 16, size: 6,  drift: -22, rotate: 210, opacity: 0.52, type: "spark"   },
  { id: 20, x: 26, delay: 6.6,  duration: 12, size: 10, drift: 28,  rotate: 160, opacity: 0.44, type: "spark"   },
];

function ShuttlecockSVG({ size }: { size: number }) {
  return (
    <svg
      width={size}
      height={size * 1.5}
      viewBox="0 0 24 36"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      {/* Cork base */}
      <ellipse cx="12" cy="32" rx="4" ry="3" fill="currentColor" />
      {/* Feather strands */}
      {[4, 7, 10, 12, 14, 17, 20].map((x2, i) => (
        <line
          key={i}
          x1="12" y1="29"
          x2={x2} y2={i < 2 || i > 4 ? 8 : i === 3 ? 3 : 5}
          stroke="currentColor"
          strokeWidth="0.7"
          strokeLinecap="round"
        />
      ))}
      {/* Feather crown ring */}
      <ellipse cx="12" cy="6.5" rx="8.5" ry="2.5" fill="none" stroke="currentColor" strokeWidth="0.7" />
    </svg>
  );
}

interface BadmintonBgProps {
  /** "subtle" dims to ~30% for app shell, "vivid" for auth pages */
  intensity?: "subtle" | "vivid";
}

export function BadmintonBackground({ intensity = "vivid" }: BadmintonBgProps) {
  const intensityScale = intensity === "subtle" ? 0.28 : 1;

  return (
    <div
      className="pointer-events-none fixed inset-0 overflow-hidden"
      style={{ zIndex: -1 }}
      aria-hidden="true"
    >
      {PARTICLES.map((p) => {
        const opacity = p.opacity * intensityScale;
        const style: React.CSSProperties = {
          position: "absolute",
          left: `${p.x}%`,
          bottom: `-${p.size * 2}px`,
          width: p.type === "spark" ? p.size : p.size,
          height: p.type === "spark" ? p.size : p.size * 1.5,
          color: "#f97316",
          opacity,
          // CSS custom properties for the animation
          ["--drift" as string]: `${p.drift}px`,
          ["--rotate" as string]: `${p.rotate}deg`,
          animationName: "particle-float",
          animationDuration: `${p.duration}s`,
          animationDelay: `${p.delay}s`,
          animationTimingFunction: "linear",
          animationIterationCount: "infinite",
          animationFillMode: "both",
        };

        if (p.type === "spark") {
          return (
            <div
              key={p.id}
              style={{
                ...style,
                borderRadius: "50%",
                background:
                  "radial-gradient(circle, #fb923c 0%, #f97316 40%, transparent 75%)",
                filter: `blur(${p.size > 8 ? 1.5 : 0.5}px)`,
              }}
            />
          );
        }

        return (
          <div key={p.id} style={style}>
            <ShuttlecockSVG size={p.size} />
          </div>
        );
      })}
    </div>
  );
}
