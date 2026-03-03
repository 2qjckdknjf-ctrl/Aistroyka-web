import type { ReactNode } from "react";

export function EmptyState({
  icon,
  title,
  subtitle,
  action,
  className = "",
}: {
  icon: ReactNode;
  title: string;
  subtitle: string;
  action?: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={`flex flex-col items-center justify-center gap-[var(--aistroyka-space-5)] py-[var(--aistroyka-empty-padding)] text-center ${className}`.trim()}
    >
      <div
        className="text-aistroyka-accent"
        style={{ opacity: "var(--aistroyka-opacity-subtle)" }}
        aria-hidden
      >
        {icon}
      </div>
      <div>
        <h3 className="text-[var(--aistroyka-font-headline)] font-semibold text-aistroyka-text-primary">
          {title}
        </h3>
        <p className="mt-1 text-[var(--aistroyka-font-subheadline)] text-aistroyka-text-secondary">
          {subtitle}
        </p>
      </div>
      {action ? <div>{action}</div> : null}
    </div>
  );
}
