export function Skeleton({ lines = 3, className = "" }: { lines?: number; className?: string }) {
  return (
    <div
      className={`flex flex-col gap-[var(--aistroyka-space-4)] ${className}`.trim()}
    >
      {Array.from({ length: lines }, (_, i) => (
        <div
          key={i}
          className="rounded-[var(--aistroyka-radius-xs)] bg-aistroyka-text-tertiary"
          style={{
            height: "var(--aistroyka-skeleton-line-height)",
            width: i === lines - 1 && lines > 1 ? "60%" : "100%",
            opacity: "var(--aistroyka-opacity-skeleton-line)",
          }}
        />
      ))}
    </div>
  );
}

export function SkeletonCard({ className = "" }: { className?: string }) {
  return (
    <div
      className={`rounded-[var(--aistroyka-radius-xl)] border border-[var(--aistroyka-card-border-e1)] bg-[var(--aistroyka-card-bg)] p-[var(--aistroyka-card-padding)] ${className}`.trim()}
    >
      <div
        className="mb-[var(--aistroyka-space-3)] h-[var(--aistroyka-skeleton-title-height)] w-1/2 rounded-[var(--aistroyka-radius-xs)] bg-aistroyka-text-tertiary"
        style={{ opacity: "var(--aistroyka-opacity-skeleton-title)" }}
      />
      <Skeleton lines={2} />
    </div>
  );
}
