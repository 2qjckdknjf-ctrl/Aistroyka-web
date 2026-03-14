"use client";

import { motion } from "framer-motion";

type AIInsightCardProps = {
  title: string;
  description?: string;
  children?: React.ReactNode;
  className?: string;
};

export function AIInsightCard({ title, description, children, className = "" }: AIInsightCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className={`rounded-[var(--radius-main)] border border-[var(--border-main)] bg-[var(--bg-card)] p-6 shadow-[var(--aistroyka-shadow-e1)] ring-1 ring-[var(--ai-yellow)]/10 ${className}`}
    >
      <h3 className="font-heading text-lg font-semibold text-[var(--text-main)]">{title}</h3>
      {description && (
        <p className="mt-2 text-[var(--aistroyka-font-footnote)] text-[var(--text-muted)]">
          {description}
        </p>
      )}
      {children && <div className="mt-4">{children}</div>}
    </motion.div>
  );
}
