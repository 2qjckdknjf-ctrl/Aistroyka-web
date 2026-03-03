"use client";

import { Card } from "@/components/ui";

export function AdminKpiCard({
  title,
  value,
  subtitle,
  variant = "default",
}: {
  title: string;
  value: string | number;
  subtitle?: string;
  variant?: "default" | "warning" | "error";
}) {
  const borderClass =
    variant === "error"
      ? "border-l-aistroyka-error"
      : variant === "warning"
        ? "border-l-aistroyka-warning"
        : "border-l-aistroyka-accent";
  return (
    <Card className={"border-l-4 " + borderClass}>
      <p className="text-aistroyka-subheadline text-aistroyka-text-tertiary">{title}</p>
      <p className="mt-1 text-aistroyka-title2 font-semibold tabular-nums text-aistroyka-text-primary">
        {value}
      </p>
      {subtitle ? (
        <p className="mt-0.5 text-aistroyka-caption text-aistroyka-text-secondary">{subtitle}</p>
      ) : null}
    </Card>
  );
}
