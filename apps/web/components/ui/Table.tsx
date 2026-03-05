import type { ReactNode } from "react";

export function Table({
  children,
  className = "",
  "aria-label": ariaLabel,
}: {
  children: ReactNode;
  className?: string;
  "aria-label"?: string;
}) {
  return (
    <div className={`overflow-x-auto rounded-[var(--aistroyka-radius-card)] border border-aistroyka-border-subtle ${className}`.trim()}>
      <table className="w-full min-w-[400px] border-collapse text-left text-aistroyka-subheadline" aria-label={ariaLabel}>
        {children}
      </table>
    </div>
  );
}

export function TableHead({ children }: { children: ReactNode }) {
  return <thead className="bg-aistroyka-surface-raised">{children}</thead>;
}

export function TableBody({ children }: { children: ReactNode }) {
  return <tbody className="divide-y divide-aistroyka-border-subtle">{children}</tbody>;
}

export function TableRow({
  children,
  className = "",
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <tr
      className={`border-b border-aistroyka-border-subtle last:border-b-0 hover:bg-aistroyka-surface-raised/50 transition-colors ${className}`.trim()}
    >
      {children}
    </tr>
  );
}

export function TableHeaderCell({
  children,
  className = "",
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <th
      scope="col"
      className={`px-[var(--aistroyka-space-4)] py-[var(--aistroyka-space-3)] text-[var(--aistroyka-font-caption)] font-semibold uppercase tracking-wide text-aistroyka-text-tertiary ${className}`.trim()}
    >
      {children}
    </th>
  );
}

export function TableCell({
  children,
  className = "",
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <td className={`px-[var(--aistroyka-space-4)] py-[var(--aistroyka-space-3)] text-aistroyka-text-primary ${className}`.trim()}>
      {children}
    </td>
  );
}
