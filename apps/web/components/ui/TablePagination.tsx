"use client";

import type { ReactNode } from "react";

export interface TablePaginationProps {
  page: number;
  pageSize: number;
  totalCount: number;
  onPageChange: (page: number) => void;
  onPageSizeChange?: (pageSize: number) => void;
  pageSizeOptions?: number[];
  /** Optional label for screen readers */
  "aria-label"?: string;
}

export function TablePagination({
  page,
  pageSize,
  totalCount,
  onPageChange,
  onPageSizeChange,
  pageSizeOptions = [10, 25, 50, 100],
  "aria-label": ariaLabel,
}: TablePaginationProps) {
  const totalPages = Math.max(1, Math.ceil(totalCount / pageSize));
  const start = totalCount === 0 ? 0 : (page - 1) * pageSize + 1;
  const end = Math.min(page * pageSize, totalCount);

  return (
    <nav
      className="flex flex-wrap items-center justify-between gap-2 border-t border-aistroyka-border-subtle px-[var(--aistroyka-space-4)] py-[var(--aistroyka-space-3)]"
      aria-label={ariaLabel ?? "Table pagination"}
    >
      <div className="flex items-center gap-3 text-[var(--aistroyka-font-caption)] text-aistroyka-text-secondary">
        <span className="tabular-nums">
          {start}–{end} of {totalCount}
        </span>
        {onPageSizeChange && (
          <select
            aria-label="Rows per page"
            value={pageSize}
            onChange={(e) => onPageSizeChange(Number(e.target.value))}
            className="rounded-[var(--aistroyka-radius-md)] border border-aistroyka-border-subtle bg-aistroyka-bg-primary px-2 py-1 text-aistroyka-text-primary focus:outline-none focus:ring-2 focus:ring-aistroyka-accent"
          >
            {pageSizeOptions.map((n) => (
              <option key={n} value={n}>
                {n}
              </option>
            ))}
          </select>
        )}
      </div>
      <div className="flex items-center gap-1">
        <button
          type="button"
          onClick={() => onPageChange(page - 1)}
          disabled={page <= 1}
          className="min-h-aistroyka-touch min-w-aistroyka-touch inline-flex items-center justify-center rounded-[var(--aistroyka-radius-md)] px-2 text-aistroyka-text-secondary transition-colors hover:bg-aistroyka-surface-raised disabled:opacity-50 disabled:hover:bg-transparent focus:outline-none focus:ring-2 focus:ring-aistroyka-accent"
          aria-label="Previous page"
        >
          ←
        </button>
        <span className="px-2 text-[var(--aistroyka-font-caption)] text-aistroyka-text-secondary tabular-nums" aria-live="polite">
          Page {page} of {totalPages}
        </span>
        <button
          type="button"
          onClick={() => onPageChange(page + 1)}
          disabled={page >= totalPages}
          className="min-h-aistroyka-touch min-w-aistroyka-touch inline-flex items-center justify-center rounded-[var(--aistroyka-radius-md)] px-2 text-aistroyka-text-secondary transition-colors hover:bg-aistroyka-surface-raised disabled:opacity-50 disabled:hover:bg-transparent focus:outline-none focus:ring-2 focus:ring-aistroyka-accent"
          aria-label="Next page"
        >
          →
        </button>
      </div>
    </nav>
  );
}
