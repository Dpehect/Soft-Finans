import React from "react";

type RunningFoxProps = {
  size?: "sm" | "md" | "lg";
  text?: string;
  subtext?: string;
  className?: string;
  showTrack?: boolean;
  showParticles?: boolean;
};

export function RunningFox({
  size = "md",
  text,
  subtext,
  className = "",
  showTrack = true,
  showParticles = true,
}: RunningFoxProps) {
  // Dimension scale
  const dimensions = {
    sm: { width: 140, height: 70 },
    md: { width: 220, height: 110 },
    lg: { width: 320, height: 160 },
  }[size];

  return (
    <div className={`flex flex-col items-center justify-center select-none ${className}`}>
      <div className="relative">
        <svg
          width={dimensions.width}
          height={dimensions.height}
          viewBox="0 0 240 120"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className="overflow-visible drop-shadow-[0_8px_16px_rgba(249,115,22,0.25)]"
        >
          <defs>
            {/* Fox coat gradients */}
            <linearGradient id="foxCoat" x1="40" y1="20" x2="190" y2="80" gradientUnits="userSpaceOnUse">
              <stop offset="0%" stopColor="#ea580c" />
              <stop offset="45%" stopColor="#f97316" />
              <stop offset="85%" stopColor="#fb923c" />
              <stop offset="100%" stopColor="#f59e0b" />
            </linearGradient>

            <linearGradient id="foxBelly" x1="70" y1="40" x2="180" y2="75" gradientUnits="userSpaceOnUse">
              <stop offset="0%" stopColor="#f8fafc" />
              <stop offset="50%" stopColor="#ffedd5" />
              <stop offset="100%" stopColor="#ffffff" />
            </linearGradient>

            <linearGradient id="foxDark" x1="50" y1="30" x2="150" y2="80" gradientUnits="userSpaceOnUse">
              <stop offset="0%" stopColor="#c2410c" />
              <stop offset="100%" stopColor="#9a3412" />
            </linearGradient>

            <linearGradient id="speedGlow" x1="0" y1="0" x2="240" y2="0" gradientUnits="userSpaceOnUse">
              <stop offset="0%" stopColor="#38bdf8" stopOpacity="0" />
              <stop offset="50%" stopColor="#38bdf8" stopOpacity="0.8" />
              <stop offset="100%" stopColor="#f97316" stopOpacity="0" />
            </linearGradient>

            <filter id="foxGlow" x="-20%" y="-20%" width="140%" height="140%">
              <feGaussianBlur stdDeviation="3" result="blur" />
              <feComposite in="SourceGraphic" in2="blur" operator="over" />
            </filter>
          </defs>

          <style>{`
            @keyframes rfGallop {
              0%   { transform: translateY(0px) rotate(0deg); }
              20%  { transform: translateY(-9px) rotate(-3.5deg); }
              45%  { transform: translateY(-4px) rotate(-1deg); }
              65%  { transform: translateY(4px) rotate(2deg); }
              85%  { transform: translateY(1px) rotate(0.5deg); }
              100% { transform: translateY(0px) rotate(0deg); }
            }

            @keyframes rfFrontRight {
              0%   { transform: rotate(-35deg); }
              22%  { transform: rotate(15deg); }
              50%  { transform: rotate(45deg); }
              75%  { transform: rotate(5deg); }
              100% { transform: rotate(-35deg); }
            }

            @keyframes rfFrontLeft {
              0%   { transform: rotate(38deg); }
              28%  { transform: rotate(5deg); }
              55%  { transform: rotate(-35deg); }
              80%  { transform: rotate(12deg); }
              100% { transform: rotate(38deg); }
            }

            @keyframes rfBackRight {
              0%   { transform: rotate(42deg); }
              25%  { transform: rotate(-10deg); }
              50%  { transform: rotate(-42deg); }
              75%  { transform: rotate(10deg); }
              100% { transform: rotate(42deg); }
            }

            @keyframes rfBackLeft {
              0%   { transform: rotate(-38deg); }
              25%  { transform: rotate(8deg); }
              50%  { transform: rotate(45deg); }
              75%  { transform: rotate(-12deg); }
              100% { transform: rotate(-38deg); }
            }

            @keyframes rfTail {
              0%   { transform: rotate(-8deg); }
              35%  { transform: rotate(14deg); }
              65%  { transform: rotate(-5deg); }
              100% { transform: rotate(-8deg); }
            }

            @keyframes rfEar {
              0%   { transform: rotate(0deg); }
              50%  { transform: rotate(-6deg); }
              100% { transform: rotate(0deg); }
            }

            @keyframes rfGroundDash {
              0%   { transform: translateX(0); }
              100% { transform: translateX(-40px); }
            }

            @keyframes rfStreak {
              0%   { transform: translateX(60px); opacity: 0; }
              40%  { opacity: 0.8; }
              100% { transform: translateX(-120px); opacity: 0; }
            }

            @keyframes rfDust {
              0%   { transform: translate(0, 0) scale(0.6); opacity: 0.8; }
              100% { transform: translate(-35px, -12px) scale(1.4); opacity: 0; }
            }

            .rf-fox-group {
              animation: rfGallop 0.65s cubic-bezier(0.45, 0.05, 0.55, 0.95) infinite;
              transform-origin: 120px 65px;
            }
            .rf-leg-fr {
              animation: rfFrontRight 0.65s cubic-bezier(0.45, 0.05, 0.55, 0.95) infinite;
              transform-origin: 152px 64px;
            }
            .rf-leg-fl {
              animation: rfFrontLeft 0.65s cubic-bezier(0.45, 0.05, 0.55, 0.95) infinite;
              transform-origin: 148px 63px;
            }
            .rf-leg-br {
              animation: rfBackRight 0.65s cubic-bezier(0.45, 0.05, 0.55, 0.95) infinite;
              transform-origin: 82px 60px;
            }
            .rf-leg-bl {
              animation: rfBackLeft 0.65s cubic-bezier(0.45, 0.05, 0.55, 0.95) infinite;
              transform-origin: 78px 58px;
            }
            .rf-tail {
              animation: rfTail 0.65s ease-in-out infinite;
              transform-origin: 65px 56px;
            }
            .rf-ear {
              animation: rfEar 0.65s ease-in-out infinite;
              transform-origin: 172px 28px;
            }
            .rf-ground {
              animation: rfGroundDash 0.35s linear infinite;
            }
            .rf-streak-1 { animation: rfStreak 0.8s linear infinite; }
            .rf-streak-2 { animation: rfStreak 1.1s 0.25s linear infinite; }
            .rf-streak-3 { animation: rfStreak 0.7s 0.45s linear infinite; }
            .rf-dust-1   { animation: rfDust 0.65s 0.1s ease-out infinite; }
            .rf-dust-2   { animation: rfDust 0.65s 0.4s ease-out infinite; }
          `}</style>

          {/* Speed / wind streaks */}
          {showParticles && (
            <g opacity="0.65">
              <line x1="220" y1="28" x2="160" y2="28" stroke="#38bdf8" strokeWidth="1.5" strokeLinecap="round" className="rf-streak-1" />
              <line x1="200" y1="48" x2="130" y2="48" stroke="#f97316" strokeWidth="1.5" strokeLinecap="round" className="rf-streak-2" />
              <line x1="230" y1="72" x2="175" y2="72" stroke="#fbbf24" strokeWidth="1.2" strokeLinecap="round" className="rf-streak-3" />
            </g>
          )}

          {/* Running ground track */}
          {showTrack && (
            <g>
              {/* Soft neon track guideline */}
              <line x1="10" y1="104" x2="230" y2="104" stroke="rgba(56, 189, 248, 0.15)" strokeWidth="1.5" strokeDasharray="3 4" />
              {/* Fast moving track hashes */}
              <g className="rf-ground">
                <line x1="0" y1="104" x2="280" y2="104" stroke="url(#speedGlow)" strokeWidth="2" strokeDasharray="16 14" strokeLinecap="round" />
              </g>
              {/* Dust particles kicked from paws */}
              <circle cx="68" cy="98" r="2.5" fill="#f97316" className="rf-dust-1" />
              <circle cx="74" cy="99" r="1.8" fill="#fbbf24" className="rf-dust-2" />
            </g>
          )}

          {/* Main Fox Group with Gallop Bobbing */}
          <g className="rf-fox-group">
            {/* Background Legs (Darker shade) */}
            {/* Left Hind Leg (Far) */}
            <g className="rf-leg-bl">
              <path
                d="M78 58 Q70 74 65 84 Q62 92 56 94"
                stroke="url(#foxDark)"
                strokeWidth="4.5"
                strokeLinecap="round"
                fill="none"
              />
              <path d="M56 94 L50 96" stroke="#1e293b" strokeWidth="3" strokeLinecap="round" />
            </g>

            {/* Left Front Leg (Far) */}
            <g className="rf-leg-fl">
              <path
                d="M148 63 Q156 75 162 86 Q165 92 170 94"
                stroke="url(#foxDark)"
                strokeWidth="4"
                strokeLinecap="round"
                fill="none"
              />
              <path d="M170 94 L176 95" stroke="#1e293b" strokeWidth="3" strokeLinecap="round" />
            </g>

            {/* Magnificent Bushy Fox Tail */}
            <g className="rf-tail">
              {/* Tail Main Fluff */}
              <path
                d="M68 56 C50 48 26 40 16 48 C6 56 12 70 28 68 C45 66 60 62 68 56 Z"
                fill="url(#foxCoat)"
              />
              {/* White tail tip */}
              <path
                d="M16 48 C10 52 8 60 14 65 C19 68 25 66 28 64 C23 60 18 55 16 48 Z"
                fill="url(#foxBelly)"
              />
              {/* Tail flame highlight */}
              <path
                d="M32 50 C44 48 54 52 64 55"
                stroke="#fed7aa"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeDasharray="2 3"
              />
            </g>

            {/* Fox Torso / Body */}
            {/* Back curvature */}
            <path
              d="M66 56 C78 48 108 44 140 48 C155 50 165 54 168 62 C162 70 148 72 128 72 C98 72 78 68 66 56 Z"
              fill="url(#foxCoat)"
            />

            {/* White/Cream Chest and Underbelly */}
            <path
              d="M130 54 C148 55 162 58 166 64 C162 70 145 71 128 70 C108 70 90 68 82 64 C94 60 114 54 130 54 Z"
              fill="url(#foxBelly)"
            />

            {/* Fox Head & Neck */}
            <g>
              {/* Neck & Cheeks */}
              <path
                d="M142 50 C150 44 160 40 170 42 C178 43 186 46 195 50 C186 56 174 62 162 64 C152 64 145 58 142 50 Z"
                fill="url(#foxCoat)"
              />
              {/* White Cheek Ruff */}
              <path
                d="M164 52 C172 52 182 53 190 51 C184 57 175 62 165 63 C163 59 163 55 164 52 Z"
                fill="url(#foxBelly)"
              />
              {/* Sharp Snout Point */}
              <polygon points="190,48 202,51 188,54" fill="url(#foxCoat)" />
              {/* Black Nose Tip */}
              <circle cx="202" cy="51" r="2.2" fill="#0f172a" />

              {/* Expressive Fox Eye */}
              <ellipse cx="178" cy="46" rx="3.2" ry="1.8" transform="rotate(-10 178 46)" fill="#0f172a" />
              <ellipse cx="178.6" cy="45.6" rx="1.2" ry="0.9" fill="#38bdf8" />
              <circle cx="179" cy="45.3" r="0.6" fill="#ffffff" />

              {/* Fox Ears (Sleek, aerodynamic pinned-back sprint ears) */}
              <g className="rf-ear">
                {/* Back ear */}
                <polygon points="156,42 162,24 168,40" fill="url(#foxDark)" />
                {/* Front ear */}
                <polygon points="162,41 170,22 176,38" fill="url(#foxCoat)" />
                {/* Inner ear pinkish cream */}
                <polygon points="165,39 170,26 173,37" fill="#fed7aa" />
              </g>
            </g>

            {/* Foreground Legs (Vibrant coat shade) */}
            {/* Right Hind Leg (Near) */}
            <g className="rf-leg-br">
              {/* Thigh muscle curve */}
              <path
                d="M82 60 Q72 74 68 84 Q65 92 60 95"
                stroke="url(#foxCoat)"
                strokeWidth="5"
                strokeLinecap="round"
                fill="none"
              />
              {/* Paw */}
              <path d="M60 95 L53 96.5" stroke="#0f172a" strokeWidth="3.5" strokeLinecap="round" />
            </g>

            {/* Right Front Leg (Near) */}
            <g className="rf-leg-fr">
              {/* Foreleg reach */}
              <path
                d="M152 64 Q162 76 170 87 Q174 93 180 95"
                stroke="url(#foxCoat)"
                strokeWidth="4.5"
                strokeLinecap="round"
                fill="none"
              />
              {/* Front Paw */}
              <path d="M180 95 L187 96" stroke="#0f172a" strokeWidth="3.2" strokeLinecap="round" />
            </g>
          </g>
        </svg>
      </div>

      {(text || subtext) && (
        <div className="mt-2.5 flex flex-col items-center text-center">
          {text && (
            <p className="text-xs font-bold uppercase tracking-[0.16em] text-orange-400 flex items-center gap-1.5">
              <span className="h-1.5 w-1.5 rounded-full bg-orange-400 animate-ping" />
              {text}
            </p>
          )}
          {subtext && (
            <p className="mt-0.5 text-[11px] text-terminal-muted tracking-wide">{subtext}</p>
          )}
        </div>
      )}
    </div>
  );
}

export default RunningFox;
