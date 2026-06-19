"use client";

import { useEffect, useState } from "react";
import { LG_FILTER_IDS } from "@/lib/design/liquid-glass";

type LiquidGlassFilterProps = {
  /** Optional prefix to avoid ID collisions in tests; production should use default. */
  idPrefix?: string;
};

/**
 * Mount once per page tree. Injects SVG displacement filters for Chromium refraction.
 * Safari/Firefox degrade to blur-only via CSS @supports.
 */
export function LiquidGlassFilter({ idPrefix = "" }: LiquidGlassFilterProps) {
  const [reduceMotion, setReduceMotion] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    const update = () => setReduceMotion(mq.matches);
    update();
    mq.addEventListener("change", update);
    return () => mq.removeEventListener("change", update);
  }, []);

  const refractionId = `${idPrefix}${LG_FILTER_IDS.refraction}`;
  const softId = `${idPrefix}${LG_FILTER_IDS.refractionSoft}`;

  return (
    <svg
      aria-hidden="true"
      focusable="false"
      className="pointer-events-none absolute h-0 w-0 overflow-hidden"
    >
      <defs>
        <filter
          id={refractionId}
          x="-20%"
          y="-20%"
          width="140%"
          height="140%"
          colorInterpolationFilters="sRGB"
        >
          <feTurbulence
            type="fractalNoise"
            baseFrequency="0.012 0.018"
            numOctaves={2}
            seed={7}
            result="noise"
          >
            {!reduceMotion && (
              <animate attributeName="seed" values="7;47;7" dur="14s" repeatCount="indefinite" />
            )}
          </feTurbulence>
          <feComponentTransfer in="noise" result="map">
            <feFuncR type="gamma" amplitude="1" exponent="8" offset="0" />
            <feFuncG type="gamma" amplitude="0" exponent="1" offset="0.5" />
            <feFuncB type="gamma" amplitude="1" exponent="8" offset="0" />
          </feComponentTransfer>
          <feGaussianBlur in="map" stdDeviation="2" result="smoothMap" />
          <feDisplacementMap
            in="SourceGraphic"
            in2="smoothMap"
            scale={18}
            xChannelSelector="R"
            yChannelSelector="B"
          />
        </filter>
        <filter
          id={softId}
          x="-20%"
          y="-20%"
          width="140%"
          height="140%"
          colorInterpolationFilters="sRGB"
        >
          <feTurbulence type="fractalNoise" baseFrequency="0.008 0.01" numOctaves={2} seed={3} result="noise" />
          <feComponentTransfer in="noise" result="map">
            <feFuncR type="gamma" amplitude="1" exponent="10" offset="0" />
            <feFuncG type="gamma" amplitude="0" exponent="1" offset="0.5" />
            <feFuncB type="gamma" amplitude="1" exponent="10" offset="0" />
          </feComponentTransfer>
          <feGaussianBlur in="map" stdDeviation="3" result="smoothMap" />
          <feDisplacementMap
            in="SourceGraphic"
            in2="smoothMap"
            scale={8}
            xChannelSelector="R"
            yChannelSelector="B"
          />
        </filter>
      </defs>
    </svg>
  );
}
