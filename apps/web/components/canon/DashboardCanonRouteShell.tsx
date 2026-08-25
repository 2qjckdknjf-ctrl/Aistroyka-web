"use client";

import type { ReactNode } from "react";
import { CanonPageHeader } from "./CanonPageHeader";

export function DashboardCanonRouteShell({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle?: string;
  children: ReactNode;
}) {
  return (
    <div className="space-y-6">
      <CanonPageHeader title={title} subtitle={subtitle} showFavorite={false} />
      {children}
    </div>
  );
}
