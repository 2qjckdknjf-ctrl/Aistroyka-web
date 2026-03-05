"use client";

export type DateRangePreset = "7d" | "30d" | "90d";

export interface DateRangePickerProps {
  from: string; // YYYY-MM-DD
  to: string;
  onFromChange: (value: string) => void;
  onToChange: (value: string) => void;
  onPreset?: (preset: DateRangePreset) => void;
  "aria-label"?: string;
}

export function DateRangePicker({
  from,
  to,
  onFromChange,
  onToChange,
  onPreset,
  "aria-label": ariaLabel,
}: DateRangePickerProps) {
  return (
    <div className="flex flex-wrap items-center gap-2" role="group" aria-label={ariaLabel ?? "Date range"}>
      {onPreset && (
        <div className="flex gap-1 rounded-[var(--aistroyka-radius-lg)] border border-aistroyka-border-subtle bg-aistroyka-surface-raised p-0.5">
          {(["7d", "30d", "90d"] as DateRangePreset[]).map((preset) => (
            <button
              key={preset}
              type="button"
              onClick={() => onPreset(preset)}
              className="rounded-[var(--aistroyka-radius-md)] px-2 py-1 text-[var(--aistroyka-font-caption)] font-medium text-aistroyka-text-secondary transition-colors hover:bg-aistroyka-surface hover:text-aistroyka-text-primary focus:outline-none focus:ring-2 focus:ring-aistroyka-accent"
            >
              {preset === "7d" ? "7 days" : preset === "30d" ? "30 days" : "90 days"}
            </button>
          ))}
        </div>
      )}
      <label className="sr-only">From</label>
      <input
        type="date"
        value={from}
        onChange={(e) => onFromChange(e.target.value)}
        className="rounded-[var(--aistroyka-radius-md)] border border-aistroyka-border-subtle bg-aistroyka-bg-primary px-2 py-1.5 text-[var(--aistroyka-font-caption)] text-aistroyka-text-primary focus:outline-none focus:ring-2 focus:ring-aistroyka-accent"
      />
      <span className="text-aistroyka-text-tertiary">–</span>
      <label className="sr-only">To</label>
      <input
        type="date"
        value={to}
        onChange={(e) => onToChange(e.target.value)}
        className="rounded-[var(--aistroyka-radius-md)] border border-aistroyka-border-subtle bg-aistroyka-bg-primary px-2 py-1.5 text-[var(--aistroyka-font-caption)] text-aistroyka-text-primary focus:outline-none focus:ring-2 focus:ring-aistroyka-accent"
      />
    </div>
  );
}
