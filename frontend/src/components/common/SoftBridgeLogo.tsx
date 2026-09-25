type SoftBridgeLogoProps = {
  className?: string;
  size?: number;
};

export function SoftBridgeLogo({ className = "", size = 48 }: SoftBridgeLogoProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 48 48"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-label="SoftBridge Finans Tilki Logosu"
    >
      <defs>
        {/* Fox gradient */}
        <linearGradient id="sbFoxOrange" x1="6" y1="8" x2="42" y2="40" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#ff781f" />
          <stop offset="40%" stopColor="#f97316" />
          <stop offset="75%" stopColor="#ea580c" />
          <stop offset="100%" stopColor="#c2410c" />
        </linearGradient>

        {/* Crest border gradient */}
        <linearGradient id="sbFoxCrest" x1="0" y1="0" x2="48" y2="48" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#f97316" />
          <stop offset="45%" stopColor="#fbbf24" />
          <stop offset="85%" stopColor="#00d4ff" />
          <stop offset="100%" stopColor="#6366f1" />
        </linearGradient>

        <linearGradient id="sbFoxGold" x1="16" y1="14" x2="32" y2="28" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#fde047" />
          <stop offset="100%" stopColor="#f59e0b" />
        </linearGradient>

        <filter id="sbFoxGlow" x="-20%" y="-20%" width="140%" height="140%">
          <feGaussianBlur stdDeviation="2" result="blur" />
          <feComposite in="SourceGraphic" in2="blur" operator="over" />
        </filter>
      </defs>

      {/* Outer rounded glass crest */}
      <rect
        x="3"
        y="3"
        width="42"
        height="42"
        rx="10"
        stroke="url(#sbFoxCrest)"
        strokeWidth="1.6"
        fill="rgba(11, 16, 28, 0.92)"
      />

      {/* Modern Geometric / Origami Fox Head ("Tilki") */}
      <g filter="url(#sbFoxGlow)">
        {/* Left Ear Outer */}
        <polygon points="24,18 11,8 17,23" fill="#ff781f" />
        {/* Right Ear Outer */}
        <polygon points="24,18 37,8 31,23" fill="#ea580c" />

        {/* Left Ear Inner Fluff */}
        <polygon points="14,12 18,21 13,20" fill="#ffedd5" />
        {/* Right Ear Inner Fluff */}
        <polygon points="34,12 30,21 35,20" fill="#fed7aa" />

        {/* Upper Forehead Diamond */}
        <polygon points="24,16 19,23 24,28 29,23" fill="url(#sbFoxGold)" />

        {/* Left Upper Cheek */}
        <polygon points="19,23 7,27 16,31 24,28" fill="#f97316" />
        {/* Right Upper Cheek */}
        <polygon points="29,23 41,27 32,31 24,28" fill="#c2410c" />

        {/* White / Cream Cheek Tufts */}
        <polygon points="7,27 16,31 24,36 14,35" fill="#ffffff" opacity="0.95" />
        <polygon points="41,27 32,31 24,36 34,35" fill="#f1f5f9" opacity="0.95" />

        {/* Central Snout Plane */}
        <polygon points="24,28 20,34 24,37.5 28,34" fill="#ea580c" />

        {/* Nose Tip */}
        <polygon points="22.2,36.5 25.8,36.5 24,38.5" fill="#090d16" />

        {/* Fox Sly Intelligent Eyes (Left & Right) */}
        {/* Left Eye */}
        <path d="M15.5 24.5 Q18.5 23 20.5 25.5 Q18 26.5 15.5 24.5 Z" fill="#090d16" />
        <circle cx="18.8" cy="24.8" r="0.9" fill="#00e5ff" />

        {/* Right Eye */}
        <path d="M32.5 24.5 Q29.5 23 27.5 25.5 Q30 26.5 32.5 24.5 Z" fill="#090d16" />
        <circle cx="29.2" cy="24.8" r="0.9" fill="#00e5ff" />

        {/* Lower Bridge Speed Arc */}
        <path
          d="M10 40.5 C16 38 32 38 38 40.5"
          stroke="#00d4ff"
          strokeWidth="1.5"
          strokeLinecap="round"
          opacity="0.8"
        />
      </g>
    </svg>
  );
}

export default SoftBridgeLogo;
