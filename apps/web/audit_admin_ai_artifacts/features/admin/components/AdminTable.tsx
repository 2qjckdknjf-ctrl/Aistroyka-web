"use client";

import type { ReactNode } from "react";

export function AdminTable<R>({
  columns,
  rows,
  keyFn,
  renderCell,
  emptyMessage = "No rows",
}: {
  columns: { key: string; label: string }[];
  rows: R[];
  keyFn: (row: R) => string;
  renderCell: (row: R, columnKey: string) => ReactNode;
  emptyMessage?: string;
}) {
  if (rows.length === 0) {
    return (
      <div className="rounded border border-aistroyka-border-subtle bg-aistroyka-surface-raised/30 p-6 text-center text-aistroyka-subheadline text-aistroyka-text-secondary">
        {emptyMessage}
      </div>
    );
  }
  return (
    <div className="overflow-x-auto rounded border border-aistroyka-border-subtle">
      <table className="w-full min-w-[320px] text-left text-aistroyka-subheadline">
        <thead>
          <tr className="border-b border-aistroyka-border-subtle bg-aistroyka-surface-raised">
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
