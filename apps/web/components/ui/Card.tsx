import type { ReactNode } from "react";

/**
 * Legacy Card API → Liquid Glass `.card` / `.card-elevated` (canon v4).
 * Prefer `DashboardGlassCard` for new dashboard panels.
 */
export function Card({
  children,
  elevated = false,
  className = "",
}: {
  children: ReactNode;
  elevated?: boolean;
  className?: string;
}) {
  return (
    <div className={`${elevated ? "card-elevated" : "card"} ${className}`.trim()}>
      {children}
    </div>
  );
}
