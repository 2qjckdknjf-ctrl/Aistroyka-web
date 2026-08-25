import { ArrowRight, FileText, Lock, ShieldCheck } from "lucide-react";
import { Link } from "@/i18n/navigation";

export type SecuritySectionCopy = {
  eyebrow: string;
  title: string;
  lead: string;
  linkLabel: string;
  points: readonly { title: string; text: string }[];
};

const POINT_ICONS = [ShieldCheck, FileText, Lock] as const;

export function SecuritySection({ copy }: { copy: SecuritySectionCopy }) {
  return (
    <section className="v41-section v41-security-section" id="security">
      <div className="v41-page v41-security-grid">
        <div className="v41-story-copy">
          <p className="v41-eyebrow">{copy.eyebrow}</p>
          <h2>{copy.title}</h2>
          <p>{copy.lead}</p>
          <Link className="v41-text-link" href="/security">
            {copy.linkLabel} <ArrowRight size={18} />
          </Link>
        </div>
        <div className="v41-security-points">
          {copy.points.map((point, index) => {
            const Icon = POINT_ICONS[index] ?? ShieldCheck;
            return (
              <article key={point.title}>
                <Icon size={27} />
                <div>
                  <strong>{point.title}</strong>
                  <span>{point.text}</span>
                </div>
              </article>
            );
          })}
        </div>
      </div>
    </section>
  );
}
