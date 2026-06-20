"use client";

import type { ReactNode } from "react";
import { useTranslations } from "next-intl";

export function AdminTable<R>({
  columns,
  rows,
  keyFn,
  renderCell,
  emptyMessage,
}: {
  columns: { key: string; label: string }[];
  rows: R[];
  keyFn: (row: R) => string;
  renderCell: (row: R, columnKey: string) => ReactNode;
  emptyMessage?: string;
}) {
  const tDetail = useTranslations("dashboardDetail");
  const resolvedEmptyMessage = emptyMessage ?? tDetail("noRows");
  if (rows.length === 0) {
    return (
      <div className="surface-glass-muted rounded p-6 text-center text-aistroyka-subheadline text-aistroyka-text-secondary">
        {resolvedEmptyMessage}
      </div>
    );
  }
  return (
    <div className="overflow-x-auto rounded border border-aistroyka-border-subtle">
      <table className="w-full min-w-[320px] text-left text-aistroyka-subheadline">
        <thead>
          <tr className="border-b border-[var(--lg-border)] surface-glass-row">
            {columns.map((col) => (
              <th
                key={col.key}
                className="table-cell px-3 py-2 font-semibold text-aistroyka-text-primary"
              >
                {col.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr
              key={keyFn(row)}
              className="border-b border-aistroyka-border-subtle last:border-0 transition-colors hover:bg-aistroyka-surface-raised/50"
            >
              {columns.map((col) => (
                <td key={col.key} className="table-cell px-3 py-2 text-aistroyka-text-secondary">
                  {renderCell(row, col.key)}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
