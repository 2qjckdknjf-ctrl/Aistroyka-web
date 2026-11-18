"use client";

type CanonProgressRingProps = {
  value: number;
  size?: number;
  stroke?: number;
  label?: string;
  className?: string;
};

export function CanonProgressRing({
  value,
  size = 88,
  stroke = 6,
  label,
  className = "",
}: CanonProgressRingProps) {
  const clamped = Math.min(100, Math.max(0, value));
  const radius = (size - stroke) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (clamped / 100) * circumference;

  return (
    <div className={`relative inline-flex flex-col items-center ${className}`}>
      <svg width={size} height={size} className="-rotate-90" aria-hidden>
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="rgba(255,255,255,0.08)"
          strokeWidth={stroke}
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="url(#canon-ring-gradient)"
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          style={{ transition: "stroke-dashoffset 0.6s cubic-bezier(0.22, 1, 0.36, 1)" }}
        />
        <defs>
          <linearGradient id="canon-ring-gradient" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#0099cc" />
            <stop offset="50%" stopColor="#00d4ff" />
            <stop offset="100%" stopColor="#66e5ff" />
          </linearGradient>
        </defs>
      </svg>
      <span
        className="absolute inset-0 flex items-center justify-center text-sm font-bold tabular-nums text-[var(--canon-text-primary)]"
        aria-label={label}
      >
        {Math.round(clamped)}%
      </span>
    </div>
  );
}
