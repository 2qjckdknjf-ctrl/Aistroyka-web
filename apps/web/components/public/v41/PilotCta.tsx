import { ArrowRight } from "lucide-react";
import { Link } from "@/i18n/navigation";
import { V41PilotButton } from "./V41PilotButton";

export type PilotCtaCopy = {
  eyebrow: string;
  title: string;
  lead: string;
  launchPilot: string;
  contact: string;
  note: string;
};

export function PilotCta({ copy }: { copy: PilotCtaCopy }) {
  return (
    <section className="v41-pilot-section" id="pilot">
      <div className="v41-page v41-pilot-panel v41-glass">
        <div>
          <p className="v41-eyebrow">{copy.eyebrow}</p>
          <h2>{copy.title}</h2>
          <p>{copy.lead}</p>
        </div>
        <div className="v41-pilot-actions">
          <V41PilotButton testId="cta.public.home.launch-pilot">
            {copy.launchPilot} <ArrowRight size={19} />
          </V41PilotButton>
          <Link className="v41-btn v41-btn-secondary" href="/contact">
            {copy.contact}
          </Link>
          <span>{copy.note}</span>
        </div>
      </div>
    </section>
  );
}
