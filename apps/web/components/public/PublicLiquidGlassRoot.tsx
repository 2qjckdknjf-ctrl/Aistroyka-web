"use client";

import { LiquidGlassFilter } from "@/components/design/liquid-glass";

/** Mount canonical SVG refraction filters once per public layout tree. */
export function PublicLiquidGlassRoot() {
  return <LiquidGlassFilter />;
}
