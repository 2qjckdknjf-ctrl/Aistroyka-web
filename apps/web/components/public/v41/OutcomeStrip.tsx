import { Camera, Clock, TrendingUp, TriangleAlert } from "lucide-react";

const ICONS = [Clock, Camera, TriangleAlert, TrendingUp] as const;

export type OutcomeItem = { value: string; label: string };

export function OutcomeStrip({ items, ariaLabel }: { items: readonly OutcomeItem[]; ariaLabel: string }) {
  return (
    <section className="v41-outcomes v41-page" aria-label={ariaLabel}>
      {items.map((item, index) => {
        const Icon = ICONS[index] ?? Clock;
        return (
          <article key={item.label} className="v41-outcome">
            <Icon size={26} />
            <div>
              <strong>{item.value}</strong>
              <span>{item.label}</span>
            </div>
          </article>
        );
      })}
    </section>
  );
}
