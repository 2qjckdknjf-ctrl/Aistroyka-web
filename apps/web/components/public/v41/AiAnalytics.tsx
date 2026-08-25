import { ArrowRight, Sparkles } from "lucide-react";
import { Link } from "@/i18n/navigation";
import { V41_ASSETS } from "./v41-assets";

export type AiAnalyticsCopy = {
  eyebrow: string;
  title: string;
  lead: string;
  findingTitle: string;
  findingMeta: string;
  linkLabel: string;
  imageAlt: string;
};

export function AiAnalytics({ copy }: { copy: AiAnalyticsCopy }) {
  return (
    <section className="v41-section v41-ai-section">
      <div className="v41-page v41-ai-grid">
        <figure className="v41-ai-product v41-glass">
          <img src={V41_ASSETS.aiAnalytics} alt={copy.imageAlt} width={1280} height={800} loading="lazy" />
        </figure>
        <div className="v41-story-copy">
          <p className="v41-eyebrow v41-eyebrow-violet">{copy.eyebrow}</p>
          <h2>{copy.title}</h2>
          <p>{copy.lead}</p>
          <div className="v41-ai-finding v41-glass">
            <Sparkles size={22} />
            <div>
              <strong>{copy.findingTitle}</strong>
              <span>{copy.findingMeta}</span>
            </div>
          </div>
          <Link className="v41-text-link v41-violet-link" href="/ai-construction-control">
            {copy.linkLabel} <ArrowRight size={18} />
          </Link>
        </div>
      </div>
    </section>
  );
}
