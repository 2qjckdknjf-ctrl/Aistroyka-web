export function SectionHeader({
  title,
  subtitle,
  className = "",
}: {
  title: string;
  subtitle?: string;
  className?: string;
}) {
  return (
    <div className={`space-y-1 ${className}`.trim()}>
      <h2 className="text-[var(--aistroyka-font-title3)] font-semibold text-aistroyka-text-primary">{title}</h2>
      {subtitle ? (
        <p className="text-[var(--aistroyka-font-caption)] text-aistroyka-text-secondary">{subtitle}</p>
      ) : null}
    </div>
  );
}
