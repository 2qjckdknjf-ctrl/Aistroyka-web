/**
 * AISTROYKA Design System — Color palette
 * Modern AI SaaS: dark theme with construction yellow accent
 */

export const colors = {
  /** AI white — primary light element */
  aiWhite: "#FFFFFF",
  /** Construction yellow — primary accent, CTA */
  aiYellow: "#F5C518",
  /** Soft pink — S letter accent, secondary highlight */
  aiPink: "#F29CB2",
  /** Dark background — main app background */
  aiDark: "#0B0F19",

  /** Secondary background */
  bgSecondary: "#111827",
  /** Card / panel background */
  bgCard: "#1F2937",
  /** Border color */
  borderMain: "#2B3648",

  /** Primary text */
  textMain: "#F9FAFB",
  /** Muted / secondary text */
  textMuted: "#9CA3AF",
} as const;

export type ColorToken = keyof typeof colors;
