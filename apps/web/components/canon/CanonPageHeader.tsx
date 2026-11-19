"use client";

import type { ReactNode } from "react";

type CanonPageHeaderProps = {
  title: string;
  subtitle?: string;
  actions?: ReactNode;
  /** @deprecated Favorites are not wired; prop kept for call-site compatibility. */
  showFavorite?: boolean;
};

export function CanonPageHeader({ title, subtitle, actions }: CanonPageHeaderProps) {
  return (
    <header className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
      <div>
        {subtitle ? <p className="canon-section-title">{subtitle}</p> : null}
        <div className="mt-1 flex items-center gap-2">
          <h1 className="canon-page-title">{title}</h1>
        </div>
      </div>
      {actions ? (
        <div className="flex w-full flex-wrap items-center gap-2 sm:w-auto sm:justify-end">{actions}</div>
      ) : null}
    </header>
  );
}
