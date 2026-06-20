#!/usr/bin/env bun
/**
 * One-shot codemod: replace legacy solid surface classes with Liquid Glass utilities.
 */
import { readFileSync, writeFileSync, readdirSync, statSync } from "node:fs";
import path from "node:path";

const root = path.resolve(import.meta.dir, "..");

const replacements = [
  [
    "rounded-lg border-l-4 border-l-aistroyka-warning border border-aistroyka-border-subtle bg-aistroyka-surface overflow-hidden",
    "surface-glass rounded-lg border-l-4 border-l-aistroyka-warning overflow-hidden",
  ],
  [
    "rounded-lg border border-aistroyka-border-subtle bg-aistroyka-surface overflow-hidden",
    "surface-glass rounded-lg overflow-hidden",
  ],
  [
    "rounded-lg border border-aistroyka-border-subtle bg-aistroyka-surface-raised p-4 text-sm text-aistroyka-text-secondary sm:p-6",
    "surface-glass-raised rounded-lg p-4 text-sm text-aistroyka-text-secondary sm:p-6",
  ],
  [
    "rounded-lg border border-aistroyka-border-subtle bg-aistroyka-surface-raised p-4 text-sm sm:p-6",
    "surface-glass-raised rounded-lg p-4 text-sm sm:p-6",
  ],
  [
    "rounded-lg border border-aistroyka-border-subtle bg-aistroyka-surface p-4 border-l-4 border-l-aistroyka-accent",
    "surface-glass rounded-lg p-4 border-l-4 border-l-aistroyka-accent",
  ],
  ["rounded-lg border border-aistroyka-border-subtle bg-aistroyka-surface p-4", "surface-glass rounded-lg p-4"],
  [
    "rounded-lg border border-aistroyka-border-subtle bg-aistroyka-surface-raised",
    "surface-glass-raised rounded-lg",
  ],
  ["rounded-lg border border-aistroyka-border-subtle bg-aistroyka-surface", "surface-glass rounded-lg"],
  [
    "rounded-[var(--aistroyka-radius-card)] border border-aistroyka-border-subtle bg-aistroyka-surface px-4 py-3",
    "surface-glass rounded-[var(--lg-radius)] px-4 py-3",
  ],
  [
    "rounded-[var(--aistroyka-radius-md)] border border-aistroyka-border-subtle bg-aistroyka-surface-raised px-4 py-3",
    "surface-glass-raised rounded-[var(--aistroyka-radius-md)] px-4 py-3",
  ],
  [
    "rounded-[var(--aistroyka-radius-md)] border border-aistroyka-border-subtle bg-aistroyka-surface-raised px-4 py-2",
    "surface-glass-raised rounded-[var(--aistroyka-radius-md)] px-4 py-2",
  ],
  [
    "rounded-[var(--aistroyka-radius-md)] border border-aistroyka-border-subtle bg-aistroyka-surface-raised p-4",
    "surface-glass-raised rounded-[var(--aistroyka-radius-md)] p-4",
  ],
  [
    "rounded-card border border-aistroyka-border-subtle bg-aistroyka-surface-raised/80 px-4 py-2.5",
    "surface-glass-raised rounded-card px-4 py-2.5",
  ],
  [
    "rounded-aistroyka-card border border-aistroyka-border-subtle bg-aistroyka-surface shadow-aistroyka-e1",
    "surface-glass rounded-aistroyka-card shadow-aistroyka-e1",
  ],
  [
    "rounded border border-aistroyka-border-subtle bg-aistroyka-surface-muted/30 p-3",
    "surface-glass-muted rounded p-3",
  ],
  [
    "rounded border border-aistroyka-border-subtle bg-aistroyka-surface-muted/40 p-3 text-sm",
    "surface-glass-muted rounded p-3 text-sm",
  ],
  [
    "rounded border border-aistroyka-border-subtle bg-aistroyka-surface-muted/50 p-4 text-center text-sm text-aistroyka-text-tertiary",
    "surface-glass-muted rounded p-4 text-center text-sm text-aistroyka-text-tertiary",
  ],
  [
    "rounded border border-aistroyka-border-subtle bg-aistroyka-surface-muted/30 p-3 text-xs",
    "surface-glass-muted rounded p-3 text-xs",
  ],
  [
    "rounded border border-aistroyka-border-subtle bg-aistroyka-surface-muted/20 p-3 text-xs",
    "surface-glass-muted rounded p-3 text-xs",
  ],
  [
    "rounded border border-aistroyka-border-subtle bg-aistroyka-surface-muted/30 px-3 py-2",
    "surface-glass-muted rounded px-3 py-2",
  ],
  [
    "rounded border border-aistroyka-border-subtle bg-aistroyka-surface-muted/20",
    "surface-glass-muted rounded",
  ],
  [
    "rounded border border-aistroyka-border-subtle bg-aistroyka-surface px-3 py-2 text-aistroyka-text-primary min-h-[88px]",
    "input-field-sm min-h-[88px] text-aistroyka-text-primary",
  ],
  [
    "rounded border border-aistroyka-border-subtle bg-aistroyka-surface px-3 py-2 text-aistroyka-text-primary",
    "input-field-sm text-aistroyka-text-primary",
  ],
  [
    "w-full rounded border border-aistroyka-border-subtle bg-aistroyka-surface px-3 py-2 text-aistroyka-text-primary min-h-[72px]",
    "input-field-sm w-full min-h-[72px] text-aistroyka-text-primary",
  ],
  [
    "flex-1 rounded border border-aistroyka-border-subtle bg-aistroyka-surface px-3 py-2 text-aistroyka-text-primary",
    "input-field-sm flex-1 text-aistroyka-text-primary",
  ],
  [
    "w-24 rounded border border-aistroyka-border-subtle bg-aistroyka-surface px-3 py-2 text-aistroyka-text-primary",
    "input-field-sm w-24 text-aistroyka-text-primary",
  ],
  [
    "rounded border border-aistroyka-border-subtle bg-aistroyka-surface-raised px-2 py-1 text-sm",
    "input-field-sm px-2 py-1 text-sm",
  ],
  ["rounded border border-aistroyka-border-subtle bg-aistroyka-surface-raised px-2 py-1", "input-field-sm px-2 py-1"],
  [
    "rounded border border-aistroyka-border-subtle bg-aistroyka-surface-raised px-2 py-1 text-aistroyka-subheadline",
    "input-field-sm px-2 py-1 text-aistroyka-subheadline",
  ],
  [
    "min-w-[240px] rounded border border-aistroyka-border-subtle bg-aistroyka-surface-raised px-3 py-2 font-mono text-aistroyka-subheadline",
    "input-field-sm min-w-[240px] font-mono text-aistroyka-subheadline",
  ],
  [
    "rounded-aistroyka-md border border-aistroyka-border-subtle bg-aistroyka-surface px-2 py-1 text-aistroyka-callout",
    "input-field-sm rounded-aistroyka-md px-2 py-1 text-aistroyka-callout",
  ],
  [
    "rounded border border-aistroyka-border-subtle bg-aistroyka-surface px-2 py-1 text-aistroyka-callout",
    "input-field-sm px-2 py-1 text-aistroyka-callout",
  ],
  [
    "min-h-[36px] rounded-aistroyka-lg border border-aistroyka-border-subtle bg-aistroyka-surface px-3 py-2 text-sm disabled:opacity-50",
    "input-field-sm disabled:opacity-50",
  ],
  [
    "rounded-md border border-aistroyka-border-subtle bg-aistroyka-surface-raised p-4 text-aistroyka-footnote text-aistroyka-text-secondary",
    "surface-glass-raised rounded-md p-4 text-aistroyka-footnote text-aistroyka-text-secondary",
  ],
  [
    "rounded border border-aistroyka-border-subtle bg-aistroyka-surface-raised/30 p-6 text-center text-aistroyka-subheadline text-aistroyka-text-secondary",
    "surface-glass-muted rounded p-6 text-center text-aistroyka-subheadline text-aistroyka-text-secondary",
  ],
  ["border-b border-aistroyka-border-subtle bg-aistroyka-surface-raised", "border-b border-[var(--lg-border)] surface-glass-row"],
  [
    "rounded-[var(--aistroyka-radius-lg)] border border-aistroyka-border-subtle bg-aistroyka-surface-raised p-0.5",
    "surface-glass-raised rounded-[var(--aistroyka-radius-lg)] p-0.5",
  ],
  [
    "flex rounded-aistroyka-lg border border-aistroyka-border-subtle bg-aistroyka-surface-raised p-0.5",
    "surface-glass-raised flex rounded-aistroyka-lg p-0.5",
  ],
  [
    "flex rounded-[var(--aistroyka-radius-lg)] border border-aistroyka-border-subtle bg-aistroyka-surface-raised p-0.5",
    "surface-glass-raised flex rounded-[var(--aistroyka-radius-lg)] p-0.5",
  ],
  [
    "absolute top-full z-50 mt-1 min-w-[160px] rounded-[var(--aistroyka-radius-lg)] border border-aistroyka-border-subtle bg-aistroyka-surface py-1 shadow-[var(--aistroyka-shadow-e3)]",
    "surface-glass-popover absolute top-full z-50 mt-1 min-w-[160px] rounded-[var(--aistroyka-radius-lg)] py-1",
  ],
  [
    "mt-2 rounded-[var(--aistroyka-radius-xl)] border border-aistroyka-border-subtle bg-aistroyka-surface shadow-[var(--aistroyka-shadow-e2)] md:hidden",
    "surface-glass-popover mt-2 rounded-[var(--aistroyka-radius-xl)] md:hidden",
  ],
  [
    "overflow-hidden rounded border border-aistroyka-border-subtle bg-aistroyka-surface-muted/20",
    "surface-glass-muted overflow-hidden rounded",
  ],
  [
    "rounded-[var(--aistroyka-radius-md)] border border-aistroyka-border-subtle bg-aistroyka-surface-raised px-2 py-1 text-aistroyka-caption font-medium text-aistroyka-text-secondary transition-colors hover:bg-aistroyka-surface hover:text-aistroyka-text-primary",
    "surface-glass-raised rounded-[var(--aistroyka-radius-md)] px-2 py-1 text-aistroyka-caption font-medium text-aistroyka-text-secondary transition-colors hover:text-aistroyka-text-primary",
  ],
  [
    "rounded-[var(--aistroyka-radius-md)] border border-aistroyka-border-subtle bg-aistroyka-surface-raised px-2 py-1.5 text-aistroyka-caption font-medium text-aistroyka-text-primary hover:bg-aistroyka-surface focus:outline-none focus:ring-2 focus:ring-aistroyka-accent",
    "surface-glass-raised rounded-[var(--aistroyka-radius-md)] px-2 py-1.5 text-aistroyka-caption font-medium text-aistroyka-text-primary focus:outline-none focus:ring-2 focus:ring-aistroyka-accent",
  ],
  [
    "mt-1 max-h-32 overflow-auto rounded border border-aistroyka-border-subtle bg-aistroyka-surface-raised p-2 text-aistroyka-footnote",
    "surface-glass-raised mt-1 max-h-32 overflow-auto rounded p-2 text-aistroyka-footnote",
  ],
  [
    "mb-3 flex flex-wrap items-center gap-2 rounded border border-aistroyka-border-subtle bg-aistroyka-surface-raised p-3",
    "surface-glass-raised mb-3 flex flex-wrap items-center gap-2 rounded p-3",
  ],
  ["border-b border-aistroyka-border-subtle bg-aistroyka-surface", "border-b border-[var(--lg-border)] surface-glass-chrome"],
  ["border-r border-aistroyka-border-subtle bg-aistroyka-surface", "border-r border-[var(--lg-border)] surface-glass-chrome"],
  [
    "border-t border-aistroyka-border-subtle bg-aistroyka-surface md:hidden",
    "border-t border-[var(--lg-border)] surface-glass-chrome md:hidden",
  ],
  [
    "flex flex-col rounded-lg border border-aistroyka-border-subtle bg-aistroyka-surface p-4",
    "surface-glass flex flex-col rounded-lg p-4",
  ],
  [
    "mb-3 rounded border border-aistroyka-border-subtle bg-aistroyka-surface-muted/50 p-2",
    "surface-glass-muted mb-3 rounded p-2",
  ],
  [
    "flex flex-wrap items-start justify-between gap-2 rounded-[var(--aistroyka-radius-md)] border border-aistroyka-border-subtle bg-aistroyka-surface-raised px-4 py-3",
    "surface-glass-raised flex flex-wrap items-start justify-between gap-2 rounded-[var(--aistroyka-radius-md)] px-4 py-3",
  ],
  [
    "rounded-[var(--aistroyka-radius-md)] border border-aistroyka-border-subtle bg-aistroyka-surface-raised px-4 py-3",
    "surface-glass-raised rounded-[var(--aistroyka-radius-md)] px-4 py-3",
  ],
  [
    "overflow-auto rounded-card-sm border border-aistroyka-border-subtle bg-aistroyka-surface-raised p-aistroyka-3 text-aistroyka-caption text-aistroyka-text-primary",
    "surface-glass-raised overflow-auto rounded-card-sm p-aistroyka-3 text-aistroyka-caption text-aistroyka-text-primary",
  ],
];

function walk(dir, out) {
  for (const entry of readdirSync(dir)) {
    const full = path.join(dir, entry);
    if (entry === "node_modules" || entry === ".next" || entry === ".open-next" || entry === ".wrangler" || entry.startsWith("audit_")) continue;
    const st = statSync(full);
    if (st.isDirectory()) walk(full, out);
    else if (/\.(tsx|ts|jsx|js)$/.test(entry) && !full.includes("apply-glass-surfaces.mjs")) out.push(full);
  }
}

const files = [];
walk(root, files);

let changed = 0;
for (const file of files) {
  let src = readFileSync(file, "utf8");
  const before = src;
  for (const [from, to] of replacements) src = src.split(from).join(to);
  if (src !== before) {
    writeFileSync(file, src, "utf8");
    changed += 1;
    console.log("updated:", path.relative(root, file));
  }
}

console.log(`\nDone. ${changed} file(s) updated.`);
