import { Building2, Check, HardHat, Users } from "lucide-react";

const ICONS = [Building2, HardHat, Users] as const;

export type RoleCard = {
  eyebrow: string;
  title: string;
  text: string;
  points: readonly string[];
};

export type RoleSolutionsCopy = {
  eyebrow: string;
  title: string;
  lead: string;
  roles: readonly RoleCard[];
};

export function RoleSolutions({ copy }: { copy: RoleSolutionsCopy }) {
  return (
    <section className="v41-section v41-page" id="roles">
      <div className="v41-section-heading centered">
        <p className="v41-eyebrow">{copy.eyebrow}</p>
        <h2>{copy.title}</h2>
        <p>{copy.lead}</p>
      </div>
      <div className="v41-role-grid">
        {copy.roles.map((role, index) => {
          const Icon = ICONS[index] ?? Building2;
          return (
            <article className="v41-role-card v41-glass" key={role.title}>
              <Icon size={30} />
              <span className="v41-role-eyebrow">{role.eyebrow}</span>
              <h3>{role.title}</h3>
              <p>{role.text}</p>
              <ul>
                {role.points.map((point) => (
                  <li key={point}>
                    <Check size={15} /> {point}
                  </li>
                ))}
              </ul>
            </article>
          );
        })}
      </div>
    </section>
  );
}
