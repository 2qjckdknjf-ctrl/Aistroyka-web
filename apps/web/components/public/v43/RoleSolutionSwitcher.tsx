"use client";

import { useEffect, useMemo, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import {
  nextSolutionRoleOnKey,
  parseSolutionRole,
  SOLUTION_ROLES,
  solutionsRoleHref,
  type SolutionRole,
} from "@/lib/public/solutions-roles";
import { ConstructionMedia, ProductWindow } from "./ProductWindow";
import { WorkflowRail } from "./WorkflowRail";

export type RoleSolutionCopy = {
  label: string;
  title: string;
  problem: string;
  benefitsTitle: string;
  benefits: string[];
  workflowTitle: string;
  workflow: Array<{ n: string; title: string; text: string }>;
  productAlt: string;
  photoAlt: string;
};

export function RoleSolutionSwitcher({
  tablistLabel,
  roles,
  productSrc,
  photoSrc,
}: {
  tablistLabel: string;
  roles: Record<SolutionRole, RoleSolutionCopy>;
  productSrc: string;
  photoSrc: string;
}) {
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();
  const roleFromUrl = parseSolutionRole(searchParams.get("role"));
  const [current, setCurrent] = useState<SolutionRole>(roleFromUrl);
  const copy = roles[current];

  useEffect(() => {
    setCurrent(roleFromUrl);
  }, [roleFromUrl]);

  const tabs = useMemo(
    () =>
      SOLUTION_ROLES.map((id) => ({
        id,
        label: roles[id].label,
      })),
    [roles],
  );

  function select(role: SolutionRole) {
    setCurrent(role);
    router.replace(solutionsRoleHref(pathname, role), { scroll: false });
  }

  return (
    <section className="v41-page">
      <div className="v43-tabs v41-glass" role="tablist" aria-label={tablistLabel}>
        {tabs.map((tab) => (
          <button
            key={tab.id}
            type="button"
            role="tab"
            id={`solution-tab-${tab.id}`}
            aria-selected={current === tab.id}
            aria-controls={`solution-panel-${tab.id}`}
            tabIndex={current === tab.id ? 0 : -1}
            onClick={() => select(tab.id)}
            onKeyDown={(event) => {
              const next = nextSolutionRoleOnKey(current, event.key);
              if (!next) return;
              event.preventDefault();
              select(next);
            }}
          >
            {tab.label}
          </button>
        ))}
      </div>
      <div
        role="tabpanel"
        id={`solution-panel-${current}`}
        aria-labelledby={`solution-tab-${current}`}
        className="v43-tab-panel v43-feature-stage"
      >
        <div>
          <h2>{copy.title}</h2>
          <p>{copy.problem}</p>
          <p className="v41-eyebrow">{copy.benefitsTitle}</p>
          <ul>
            {copy.benefits.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
          <p className="v41-eyebrow">{copy.workflowTitle}</p>
          <WorkflowRail steps={copy.workflow} />
        </div>
        <div>
          <ProductWindow src={productSrc} alt={copy.productAlt} />
            <ConstructionMedia src={photoSrc} alt={copy.photoAlt} />
        </div>
      </div>
    </section>
  );
}
