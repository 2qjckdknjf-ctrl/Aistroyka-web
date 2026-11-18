"use client";

import { useEffect, useState } from "react";

export type FeatureStageNavItem = {
  id: string;
  n: string;
  label: string;
};

export function FeatureStageNav({
  label,
  stages,
}: {
  label: string;
  stages: FeatureStageNavItem[];
}) {
  const [active, setActive] = useState(stages[0]?.id ?? "");

  const stageKey = stages.map((stage) => stage.id).join("|");

  useEffect(() => {
    const observed = stageKey
      .split("|")
      .map((id) => document.getElementById(id))
      .filter((el): el is HTMLElement => el !== null);
    if (observed.length === 0) return;

    const ids = stageKey.split("|");
    const ratios = new Map<string, number>();
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          ratios.set(entry.target.id, entry.isIntersecting ? entry.intersectionRatio : 0);
        }
        let next = ids[0] ?? "";
        let best = 0;
        for (const id of ids) {
          const ratio = ratios.get(id) ?? 0;
          if (ratio > best) {
            best = ratio;
            next = id;
          }
        }
        if (best > 0) setActive(next);
      },
      { rootMargin: "-18% 0px -55% 0px", threshold: [0, 0.2, 0.4, 0.6] },
    );

    for (const el of observed) observer.observe(el);
    return () => observer.disconnect();
  }, [stageKey]);

  return (
    <nav className="v41-page v43-stage-nav v41-glass" aria-label={label}>
      {stages.map((stage) => (
        <a key={stage.id} href={`#${stage.id}`} aria-current={active === stage.id ? "true" : undefined}>
          {stage.n} {stage.label}
        </a>
      ))}
    </nav>
  );
}
