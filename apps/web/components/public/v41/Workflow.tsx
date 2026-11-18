import { ArrowRight, Brain, Camera, Target } from "lucide-react";

const ICONS = [Camera, Brain, Target] as const;

export type WorkflowCopy = {
  eyebrow: string;
  title: string;
  lead: string;
  steps: readonly { n: string; title: string; text: string }[];
};

export function Workflow({ copy }: { copy: WorkflowCopy }) {
  return (
    <section className="v41-section v41-page" id="platform">
      <div className="v41-section-heading centered">
        <p className="v41-eyebrow">{copy.eyebrow}</p>
        <h2>{copy.title}</h2>
        <p>{copy.lead}</p>
      </div>
      <div className="v41-workflow">
        {copy.steps.map((step, index) => {
          const Icon = ICONS[index] ?? Camera;
          return (
            <article className="v41-workflow-step v41-glass" key={step.title}>
              <div className="v41-step-top">
                <span className="v41-step-icon">
                  <Icon size={28} />
                </span>
                <span className="v41-step-number">{step.n}</span>
              </div>
              <h3>{step.title}</h3>
              <p>{step.text}</p>
              {index < copy.steps.length - 1 ? <ArrowRight className="v41-step-arrow" size={24} /> : null}
            </article>
          );
        })}
      </div>
    </section>
  );
}
