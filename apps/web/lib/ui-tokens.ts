/**
 * UI tokens — design-system class names only (aistroyka tokens).
 * No raw Tailwind colors (no slate/red/amber/emerald). Use @/components/ui when possible.
 * See docs/ios-ui-source-of-truth.md and app/design-tokens.css.
 */

/** Page/section structure (spacing from tokens) */
export const LAYOUT = {
  main: "mx-auto max-w-5xl px-aistroyka-4 py-aistroyka-8",
  sectionSpacing: "mb-aistroyka-8",
  blockSpacing: "space-y-6",
} as const;

/** Typography scale (aistroyka token classes) */
export const TYPE = {
  pageTitle: "text-aistroyka-title2 font-semibold text-aistroyka-text-primary sm:text-aistroyka-title",
  sectionTitle: "text-aistroyka-headline font-semibold text-aistroyka-text-primary sm:text-aistroyka-title3",
  body: "text-aistroyka-subheadline text-aistroyka-text-primary",
  bodyMuted: "text-aistroyka-subheadline text-aistroyka-text-secondary",
  caption: "text-aistroyka-caption text-aistroyka-text-tertiary",
  link: "text-aistroyka-subheadline text-aistroyka-text-secondary hover:underline",
} as const;

/** Card: use @/components/ui Card when possible */
export const CARD =
  "rounded-aistroyka-card border border-aistroyka-border-subtle bg-aistroyka-surface p-aistroyka-4 sm:p-aistroyka-6";
export const CARD_MUTED =
  "rounded-aistroyka-card border border-aistroyka-border-subtle bg-aistroyka-surface-raised p-aistroyka-4 sm:p-aistroyka-6";

/** Status (use Badge from @/components/ui when possible) */
export const STATUS = {
  success: "text-aistroyka-success",
  warning: "text-aistroyka-warning",
  danger: "text-aistroyka-error",
  neutral: "text-aistroyka-text-secondary",
} as const;
