import { ArrowRight } from "lucide-react";
import { Link } from "@/i18n/navigation";

export function EnterpriseTeaser({
  title,
  lead,
  cta,
}: {
  title: string;
  lead: string;
  cta: string;
}) {
  return (
    <section className="v41-page v41-section">
      <div className="v43-teaser v41-glass v43-split">
        <div>
          <h2>{title}</h2>
          <p>{lead}</p>
        </div>
        <Link className="v41-btn v41-btn-primary" href="/pricing/enterprise">
          {cta} <ArrowRight size={18} />
        </Link>
      </div>
    </section>
  );
}

export function PilotTimeline({
  title,
  steps,
}: {
  title: string;
  steps: Array<{ n: string; title: string; text: string }>;
}) {
  return (
    <section className="v41-page v41-section">
      <h2>{title}</h2>
      <ol className={`v43-timeline${steps.length === 5 ? " is-five" : ""}`}>
        {steps.map((step) => (
          <li key={step.n}>
            <strong>
              {step.n}. {step.title}
            </strong>
            <p>{step.text}</p>
          </li>
        ))}
      </ol>
    </section>
  );
}
