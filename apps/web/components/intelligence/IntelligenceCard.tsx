"use client";

import type { ReactNode } from "react";
import { Card } from "@/components/ui";

export function IntelligenceCard({
  title,
  children,
  className = "",
  "aria-label": ariaLabel,
}: {
  title: string;
  children: ReactNode;
  className?: string;
  "aria-label"?: string;
}) {
  return (
    <Card className={className}>
      <h3 className="text-aistroyka-title3 font-semibold text-aistroyka-text-primary">
        {title}
      </h3>
      <div className="mt-3" aria-label={ariaLabel}>
        {children}
      </div>
    </Card>
  );
}
