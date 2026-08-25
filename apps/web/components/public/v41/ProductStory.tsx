import { ArrowRight, CheckCircle } from "lucide-react";
import { Link } from "@/i18n/navigation";
import { V41_ASSETS } from "./v41-assets";

export type ProductStoryCopy = {
  eyebrow: string;
  title: string;
  lead: string;
  points: readonly string[];
  linkLabel: string;
  caption: string;
  imageAlt: string;
};

export function ProductStory({ copy }: { copy: ProductStoryCopy }) {
  return (
    <section className="v41-section v41-product-story" id="features">
      <div className="v41-page v41-story-grid">
        <div className="v41-story-copy">
          <p className="v41-eyebrow">{copy.eyebrow}</p>
          <h2>{copy.title}</h2>
          <p>{copy.lead}</p>
          <ul className="v41-check-list">
            {copy.points.map((point) => (
              <li key={point}>
                <CheckCircle size={20} /> {point}
              </li>
            ))}
          </ul>
          <Link className="v41-text-link" href="/platform">
            {copy.linkLabel} <ArrowRight size={18} />
          </Link>
        </div>
        <figure className="v41-story-product v41-glass">
          <img src={V41_ASSETS.commandCenter} alt={copy.imageAlt} width={1280} height={800} loading="lazy" />
          <figcaption>
            <span className="v41-live-dot" /> {copy.caption}
          </figcaption>
        </figure>
      </div>
    </section>
  );
}
