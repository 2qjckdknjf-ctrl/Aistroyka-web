import { LiquidGlassFilter } from "./LiquidGlassFilter";

/** Mount once at app root — enables SVG refraction for all Liquid Glass surfaces. */
export function AppGlassRoot() {
  return <LiquidGlassFilter />;
}
