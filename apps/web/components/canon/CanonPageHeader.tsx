"use client";

import { Star } from "lucide-react";
import type { ReactNode } from "react";

type CanonPageHeaderProps = {
  title: string;
  subtitle?: string;
  actions?: ReactNode;
  showFavorite?: boolean;
};

export function CanonPageHeader({ title, subtitle, actions, showFavorite = true }: CanonPageHeaderProps) {
  return (
    <header className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
      <div>
        {subtitle ? <p className="canon-section-title">{subtitle}</p> : null}
        <div className="mt-1 flex items-center gap-2">
          <h1 className="canon-page-title">{title}</h1>
          {showFavorite ? (
            <button
              type="button"
              className="rounded-lg p-1 text-[var(--canon-text-muted)] hover:text-[var(--canon-gold)]"
              aria-label="Favorite"
            >
              <Star size={18} strokeWidth={1.75} aria-hidden />
            </button>
          ) : null}
        </div>
      </div>
      {actions ? (
        <div className="flex w-full flex-wrap items-center gap-2 sm:w-auto sm:justify-end">{actions}</div>
      ) : null}
    </header>
  );
}
