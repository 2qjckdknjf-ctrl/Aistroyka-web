"use client";

type PanelProps = {
  children: React.ReactNode;
  className?: string;
};

export function Panel({ children, className = "" }: PanelProps) {
  return (
    <div
      className={`rounded-[var(--radius-main)] border border-[var(--border-main)] bg-[var(--bg-card)]/80 backdrop-blur-sm ${className}`}
    >
      {children}
    </div>
  );
}
