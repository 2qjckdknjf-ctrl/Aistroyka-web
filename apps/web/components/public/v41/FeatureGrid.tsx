import { Brain, Building2, Camera, ClipboardList } from "lucide-react";

const ICONS = [Building2, ClipboardList, Camera, Brain] as const;

export type FeatureGridCopy = {
  eyebrow: string;
  title: string;
  lead: string;
  items: readonly { title: string; text: string }[];
};

export function FeatureGrid({ copy }: { copy: FeatureGridCopy }) {
  return (
    <section className="v41-section v41-page">
      <div className="v41-section-heading v41-split-heading">
        <div>
          <p className="v41-eyebrow">{copy.eyebrow}</p>
          <h2>{copy.title}</h2>
        </div>
        <p>{copy.lead}</p>
      </div>
      <div className="v41-feature-grid">
        {copy.items.map((item, index) => {
          const Icon = ICONS[index] ?? Building2;
          return (
            <article className="v41-feature-item" key={item.title}>
              <span className="v41-feature-icon">
                <Icon size={25} />
              </span>
              <h3>{item.title}</h3>
              <p>{item.text}</p>
            </article>
          );
        })}
      </div>
    </section>
  );
}
