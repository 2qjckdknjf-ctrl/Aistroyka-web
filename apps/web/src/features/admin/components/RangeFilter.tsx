"use client";

import { useTranslations } from "next-intl";
export type RangePreset = "24h" | "7d" | "30d";

function rangeToDates(preset: RangePreset): { from: string; to: string } {
  const to = new Date();
  const from = new Date();
  if (preset === "24h") from.setHours(from.getHours() - 24);
  else if (preset === "7d") from.setDate(from.getDate() - 7);
  else from.setDate(from.getDate() - 30);
  return {
    from: from.toISOString(),
    to: to.toISOString(),
  };
}

export function RangeFilter({
  value,
  onChange,
}: {
  value: RangePreset;
  onChange: (preset: RangePreset, range: { from: string; to: string }) => void;
}) {
  const tDetail = useTranslations("dashboardDetail");
  const PRESETS: { value: RangePreset; label: string }[] = [
    { value: "24h", label: "24h" },
    { value: "7d", label: tDetail("sevenDays") },
    { value: "30d", label: tDetail("thirtyDays") },
  ];
  return (
    <div className="flex flex-wrap items-center gap-2">
      <span className="text-aistroyka-subheadline text-aistroyka-text-secondary">{tDetail("range")}:</span>
      {PRESETS.map((p) => (
        <button
          key={p.value}
          type="button"
          onClick={() => onChange(p.value, rangeToDates(p.value))}
          className={`rounded px-2 py-1 text-aistroyka-subheadline ${
            value === p.value
              ? "bg-aistroyka-accent text-aistroyka-text-inverse"
              : "bg-aistroyka-surface-raised text-aistroyka-text-secondary hover:bg-aistroyka-border-subtle"
          }`}
        >
          {p.label}
        </button>
      ))}
    </div>
  );
}

export { rangeToDates };
