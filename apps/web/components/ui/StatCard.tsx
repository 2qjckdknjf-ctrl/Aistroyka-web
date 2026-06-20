"use client";

import { motion } from "framer-motion";
import { GlassSurface } from "@/components/design/liquid-glass";

type StatCardProps = {
  value: string | number;
  label: string;
  className?: string;
};

export function StatCard({ value, label, className = "" }: StatCardProps) {
  return (
    <motion.div initial={{ opacity: 0, scale: 0.95 }} whileInView={{ opacity: 1, scale: 1 }} viewport={{ once: true }}>
      <GlassSurface
        intensity="medium"
        padding="none"
        className={className}
        contentClassName="p-6 text-center"
        motion={["interactive"]}
      >
        <div className="font-heading text-2xl font-bold text-aistroyka-accent">{value}</div>
        <div className="mt-1 text-[var(--aistroyka-font-footnote)] text-aistroyka-text-secondary">{label}</div>
      </GlassSurface>
    </motion.div>
  );
}
