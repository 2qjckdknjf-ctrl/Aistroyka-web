/**
 * AISTROYKA Design System — Typography scale
 * Inter (body) + Space Grotesk (headings)
 */

export const fontFamily = {
  heading: "var(--font-heading), system-ui, sans-serif",
  body: "var(--font-body), system-ui, sans-serif",
  mono: "var(--font-mono), ui-monospace, monospace",
} as const;

export const fontSize = {
  xs: "0.75rem",
  sm: "0.8125rem",
  base: "1rem",
  lg: "1.0625rem",
  xl: "1.125rem",
  "2xl": "1.25rem",
  "3xl": "1.375rem",
  "4xl": "1.75rem",
  "5xl": "2.25rem",
  "6xl": "3rem",
} as const;

export const fontWeight = {
  normal: 400,
  medium: 500,
  semibold: 600,
  bold: 700,
} as const;

export const lineHeight = {
  tight: 1.25,
  snug: 1.375,
  normal: 1.5,
  relaxed: 1.625,
} as const;
