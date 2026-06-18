"use client";

import { useEffect, useState } from "react";
import {
  clampLiquidGlassIntensity,
  LG_INTENSITY_DEFAULT,
  LG_INTENSITY_MAX,
  LG_INTENSITY_MIN,
  LG_STORAGE_KEY,
} from "@/lib/design/liquid-glass";

type GlassIntensityControlProps = {
  /** Dev/preview only — never mount on production marketing pages without this flag. */
  preview?: boolean;
};

/**
 * iOS 27-style intensity slider — preview/dev gated.
 * Sets `--lg-intensity` on documentElement.
 */
export function GlassIntensityControl({ preview = false }: GlassIntensityControlProps) {
  const [intensity, setIntensity] = useState(LG_INTENSITY_DEFAULT);

  const allowed = preview && process.env.NODE_ENV !== "production";

  useEffect(() => {
    if (!allowed) return;
    const stored = localStorage.getItem(LG_STORAGE_KEY);
    const parsed = stored ? Number(stored) : LG_INTENSITY_DEFAULT;
    const value = clampLiquidGlassIntensity(Number.isNaN(parsed) ? LG_INTENSITY_DEFAULT : parsed);
    setIntensity(value);
    document.documentElement.style.setProperty("--lg-intensity", String(value));
  }, [allowed]);

  if (!allowed) return null;

  const onChange = (value: number) => {
    const clamped = clampLiquidGlassIntensity(value);
    setIntensity(clamped);
    document.documentElement.style.setProperty("--lg-intensity", String(clamped));
    localStorage.setItem(LG_STORAGE_KEY, String(clamped));
  };

  return (
    <div className="fixed bottom-4 right-4 z-50 min-w-[10rem] rounded-[var(--aistroyka-radius-lg)] border border-aistroyka-border-subtle bg-aistroyka-bg-secondary/95 px-3 py-2 shadow-[var(--aistroyka-shadow-e2)] backdrop-blur-md">
      <label htmlFor="lg-intensity-preview" className="text-[10px] font-semibold uppercase tracking-[0.14em] text-aistroyka-text-secondary">
        Glass intensity (preview)
      </label>
      <input
        id="lg-intensity-preview"
        type="range"
        min={LG_INTENSITY_MIN}
        max={LG_INTENSITY_MAX}
        value={intensity}
        onChange={(e) => onChange(Number(e.target.value))}
        className="mt-1.5 h-1 w-full cursor-pointer accent-[var(--aistroyka-accent)]"
        aria-valuemin={LG_INTENSITY_MIN}
        aria-valuemax={LG_INTENSITY_MAX}
        aria-valuenow={intensity}
      />
    </div>
  );
}
