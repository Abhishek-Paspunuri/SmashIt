/**
 * SmashLogo — SVG logo: shuttlecock + racket + fire burst.
 * Used as an <Image> replacement everywhere we reference /logo.png.
 */

interface SmashLogoProps {
  size?: number;
  className?: string;
}

export function SmashLogo({ size = 32, className = "" }: SmashLogoProps) {
  const id = `smash-logo-${size}`;
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 40 40"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-label="Smash"
    >
      <defs>
        <linearGradient id={`${id}-bg`} x1="0" y1="0" x2="40" y2="40" gradientUnits="userSpaceOnUse">
          <stop stopColor="#ff8c38" />
          <stop offset="1" stopColor="#d94600" />
        </linearGradient>
        <linearGradient id={`${id}-fire`} x1="20" y1="34" x2="20" y2="24" gradientUnits="userSpaceOnUse">
          <stop stopColor="#ffd740" />
          <stop offset="0.5" stopColor="#ff8c38" />
          <stop offset="1" stopColor="#ff8c38" stopOpacity="0" />
        </linearGradient>
        <radialGradient id={`${id}-glow`} cx="50%" cy="75%" r="40%">
          <stop stopColor="#ffd740" stopOpacity="0.45" />
          <stop offset="1" stopColor="#ffd740" stopOpacity="0" />
        </radialGradient>
      </defs>

      {/* Background */}
      <rect width="40" height="40" rx="9" fill={`url(#${id}-bg)`} />

      {/* Fire glow halo beneath cork */}
      <ellipse cx="20" cy="32" rx="9" ry="5" fill={`url(#${id}-glow)`} />

      {/* Flame — main */}
      <path
        d="M20 34 C17.5 31 14 29 15 25 C16 22 18.5 24 19 23 C19.5 22 19 19 20 18 C21 19 20.5 22 21 23 C21.5 24 24 22 25 25 C26 29 22.5 31 20 34Z"
        fill={`url(#${id}-fire)`}
      />
      {/* Flame — inner bright core */}
      <path
        d="M20 32 C18.5 30 17 28.5 17.5 26 C18 24 19.5 25.5 20 25 C20.5 25.5 22 24 22.5 26 C23 28.5 21.5 30 20 32Z"
        fill="#fff9c4"
        opacity="0.85"
      />

      {/* Cork base */}
      <ellipse cx="20" cy="24" rx="4" ry="2.2" fill="white" />

      {/* Feather strands — 7 lines fanning from cork upward */}
      {[
        [20, 22, 9,  7 ],
        [20, 22, 12, 5 ],
        [20, 22, 15.5, 4],
        [20, 22, 20, 3.5],
        [20, 22, 24.5, 4],
        [20, 22, 28, 5 ],
        [20, 22, 31, 7 ],
      ].map(([x1, y1, x2, y2], i) => (
        <line
          key={i}
          x1={x1} y1={y1}
          x2={x2} y2={y2}
          stroke="white"
          strokeWidth={i === 3 ? 1.3 : 1.1}
          strokeLinecap="round"
          opacity={i === 3 ? 1 : 0.85}
        />
      ))}

      {/* Feather crown arc */}
      <path
        d="M9 7 Q20 2.5 31 7"
        stroke="white"
        strokeWidth="1.6"
        fill="none"
        strokeLinecap="round"
      />

      {/* Racket — small in corner, top-right */}
      <g transform="rotate(-40, 31, 9)">
        {/* Racket head */}
        <ellipse cx="31" cy="9" rx="4.5" ry="3.2" fill="none" stroke="white" strokeWidth="1.1" opacity="0.75" />
        {/* String cross */}
        <line x1="31" y1="6.2" x2="31" y2="11.8" stroke="white" strokeWidth="0.6" opacity="0.5" />
        <line x1="27.2" y1="9" x2="34.8" y2="9" stroke="white" strokeWidth="0.6" opacity="0.5" />
        {/* Handle */}
        <line x1="31" y1="12" x2="31" y2="17" stroke="white" strokeWidth="1.4" strokeLinecap="round" opacity="0.7" />
      </g>

      {/* Spark dots around flame */}
      <circle cx="15" cy="29" r="0.9" fill="#ffd740" opacity="0.8" />
      <circle cx="25" cy="29" r="0.9" fill="#ffd740" opacity="0.8" />
      <circle cx="13" cy="26" r="0.6" fill="#ffd740" opacity="0.55" />
      <circle cx="27" cy="26" r="0.6" fill="#ffd740" opacity="0.55" />
    </svg>
  );
}
