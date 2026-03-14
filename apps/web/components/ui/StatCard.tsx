"use client";

import { motion } from "framer-motion";

type StatCardProps = {
  value: string | number;
  label: string;
  className?: string;
};

export function StatCard({ value, label, className = "" }: StatCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      whileInView={{ opacity: 1, scale: 1 }}
      viewport={{ once: true }}
      className={`rounded-[var(--radius-main)] border border-[var(--border-main)] bg-[var(--bg-card)] p-6 text-center ${className}`}
    >
      <div className="font-heading text-2xl font-bold text-[var(--ai-yellow)]">{value}</div>
      <div className="mt-1 text-[var(--aistroyka-font-footnote)] text-[var(--text-muted)]">
        {label}
      </div>
    </motion.div>
  );
}
