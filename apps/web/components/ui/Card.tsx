import type { ReactNode } from "react";

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
    <div
      className={`rounded-[var(--aistroyka-radius-card)] border bg-[var(--aistroyka-card-bg)] p-[var(--aistroyka-card-padding)] ${
        elevated
          ? "border-[var(--aistroyka-card-border-e2)] shadow-[var(--aistroyka-card-shadow-e2)]"
          : "border-[var(--aistroyka-card-border-e1)] shadow-[var(--aistroyka-card-shadow-e1)]"
      } ${className}`.trim()}
    >
      {children}
    </div>
  );
}
