"use client";

const base =
  "min-h-[88px] w-full rounded-[var(--aistroyka-input-radius)] border bg-[var(--aistroyka-input-bg)] px-[var(--aistroyka-input-padding)] py-2.5 text-[var(--aistroyka-font-body)] text-aistroyka-text-primary placeholder-aistroyka-text-tertiary transition-colors focus:border-[var(--aistroyka-input-focus-ring)] focus:outline-none focus:ring-2 focus:ring-aistroyka-accent/20 disabled:opacity-50 disabled:cursor-not-allowed resize-y";

const errorClass =
  "border-aistroyka-error focus:border-aistroyka-error focus:ring-aistroyka-error/20";

export function Textarea({
  id,
  label,
  error,
  disabled,
  className = "",
  ...props
}: React.ComponentProps<"textarea"> & {
  label?: string;
  error?: string;
}) {
  const hasError = Boolean(error);
  return (
    <div className={className}>
      {label ? (
        <label
          htmlFor={id}
          className="mb-1.5 block text-[var(--aistroyka-font-subheadline)] font-medium text-aistroyka-text-primary"
        >
          {label}
        </label>
      ) : null}
      <textarea
        id={id}
        disabled={disabled}
        aria-invalid={hasError}
        aria-describedby={hasError ? `${id}-error` : undefined}
        className={`${base} ${hasError ? errorClass : "border-[var(--aistroyka-input-border)]"}`}
        {...props}
      />
      {hasError ? (
        <p
          id={id ? `${id}-error` : undefined}
          className="mt-1.5 text-[var(--aistroyka-font-subheadline)] text-aistroyka-error"
          role="alert"
        >
          {error}
        </p>
      ) : null}
    </div>
  );
}
