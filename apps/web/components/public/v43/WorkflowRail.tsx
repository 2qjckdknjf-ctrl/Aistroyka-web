import type { ReactNode } from "react";

export type WorkflowRailStep = {
  n: string;
  title: string;
  text: string;
};

export function WorkflowRail({ steps, icon }: { steps: WorkflowRailStep[]; icon?: ReactNode }) {
  return (
    <ol className="v43-rail">
      {steps.map((step) => (
        <li key={step.n} className="v43-rail-step">
          <span className="v43-rail-index" aria-hidden>
            {icon ?? step.n}
          </span>
          <span>
            <strong>{step.title}</strong>
            <p>{step.text}</p>
          </span>
        </li>
      ))}
    </ol>
  );
}
