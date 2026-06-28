"use client";

import { useEffect, useState } from "react";

type ParsedMetric = {
  kind: "number";
  target: number;
  prefix: string;
  suffix: string;
  decimals: number;
};

/** Parse marketing metrics like `500+`, `12K+`, `72% complete`. */
export function parseMetricValue(raw: string): ParsedMetric | null {
  const trimmed = raw.trim();
  const match = trimmed.match(/^([^0-9]*)([\d,.]+)\s*([KkMm])?([^0-9]*)$/);
  if (!match) return null;

  const [, prefix, numPart, multiplier, suffix] = match;
  const base = Number.parseFloat(numPart.replace(",", "."));
  if (Number.isNaN(base)) return null;

  let target = base;
  if (multiplier?.toUpperCase() === "K") target *= 1_000;
  if (multiplier?.toUpperCase() === "M") target *= 1_000_000;

  const decimals = numPart.includes(".") || numPart.includes(",") ? 2 : 0;
  return { kind: "number", target, prefix: prefix ?? "", suffix: suffix ?? "", decimals };
}

function formatMetric(value: number, parsed: ParsedMetric): string {
  const { prefix, suffix, decimals, target } = parsed;
  let body: string;

  if (target >= 1_000 && suffix.startsWith("+") && !prefix && decimals === 0) {
    const k = value / 1_000;
    body = k >= 10 ? `${Math.round(k)}K` : `${k.toFixed(k >= 1 ? 0 : 1)}K`;
  } else if (decimals > 0) {
    body = value.toFixed(decimals).replace(".", ",");
  } else {
    body = String(Math.round(value));
  }

  return `${prefix}${body}${suffix}`;
}

type CountUpTextProps = {
  value: string;
  className?: string;
  durationMs?: number;
};

/** Animated count-up for hero metrics (demo balance-counter parity). */
export function CountUpText({ value, className = "", durationMs = 1400 }: CountUpTextProps) {
  const [display, setDisplay] = useState(value);

  useEffect(() => {
    const parsed = parseMetricValue(value);
    if (!parsed) {
      setDisplay(value);
      return;
    }

    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduceMotion) {
      setDisplay(value);
      return;
    }

    let frame = 0;
    let start: number | null = null;

    const step = (ts: number) => {
      if (start === null) start = ts;
      const progress = Math.min((ts - start) / durationMs, 1);
      const eased = 1 - (1 - progress) ** 3;
      setDisplay(formatMetric(parsed.target * eased, parsed));
      if (progress < 1) frame = requestAnimationFrame(step);
    };

    frame = requestAnimationFrame(step);
    return () => cancelAnimationFrame(frame);
  }, [value, durationMs]);

  return <span className={className}>{display}</span>;
}
