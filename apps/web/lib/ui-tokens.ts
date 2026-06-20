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

/** Card: use @/components/ui Card when possible (Liquid Glass surface). */
export const CARD =
  "relative isolate overflow-hidden rounded-[var(--lg-radius)] border border-[var(--lg-border)] p-aistroyka-4 sm:p-aistroyka-6 [background:color-mix(in_srgb,var(--lg-tint)_calc(var(--lg-intensity)*1%),transparent)] [backdrop-filter:blur(var(--lg-blur))] shadow-[var(--lg-shadow)]";
export const CARD_MUTED =
  "relative isolate overflow-hidden rounded-[var(--lg-radius)] border border-[var(--lg-border)] p-aistroyka-4 sm:p-aistroyka-6 [background:color-mix(in_srgb,var(--lg-tint-strong)_72%,transparent)] [backdrop-filter:blur(var(--lg-blur))] shadow-[var(--lg-shadow-hover)]";

/** Status (use Badge from @/components/ui when possible) */
export const STATUS = {
  success: "text-aistroyka-success",
  warning: "text-aistroyka-warning",
  danger: "text-aistroyka-error",
  neutral: "text-aistroyka-text-secondary",
} as const;
