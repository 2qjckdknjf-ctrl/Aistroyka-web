import type { ReactNode } from "react";

export function Metric({
  label,
  value,
  className = "",
}: {
  label: string;
  value: ReactNode;
  className?: string;
}) {
  return (
    <div className={className}>
      <dt className="text-sm text-aistroyka-text-secondary">{label}</dt>
      <dd className="mt-0.5 text-base font-medium text-aistroyka-text-primary tabular-nums">{value}</dd>
    </div>
  );
}
