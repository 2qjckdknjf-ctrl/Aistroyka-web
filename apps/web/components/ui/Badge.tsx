type Variant = "neutral" | "success" | "warning" | "danger";

const variantClasses: Record<Variant, string> = {
  neutral:
    "bg-[var(--aistroyka-badge-neutral-bg)] text-[var(--aistroyka-badge-neutral-text)]",
  success:
    "bg-[var(--aistroyka-badge-success-bg)] text-[var(--aistroyka-badge-success-text)]",
  warning:
    "bg-[var(--aistroyka-badge-warning-bg)] text-[var(--aistroyka-badge-warning-text)]",
  danger:
    "bg-[var(--aistroyka-badge-error-bg)] text-[var(--aistroyka-badge-error-text)]",
};

export function Badge({
  children,
  variant = "neutral",
  className = "",
}: {
  children: React.ReactNode;
  variant?: Variant;
  className?: string;
}) {
  return (
    <span
      className={`inline-flex items-center rounded-full px-[var(--aistroyka-space-3)] py-[var(--aistroyka-space-2)] text-[var(--aistroyka-font-caption)] font-medium ${variantClasses[variant]} ${className}`.trim()}
    >
      {children}
    </span>
  );
}
