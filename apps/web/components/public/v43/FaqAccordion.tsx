"use client";

import { useId, useState } from "react";
import { ChevronDown } from "lucide-react";

export type FaqItem = { q: string; a: string };

export function FaqAccordion({ title, items }: { title: string; items: FaqItem[] }) {
  const baseId = useId();
  const [open, setOpen] = useState(0);

  return (
    <section className="v41-page v41-section">
      <h2>{title}</h2>
      <div className="v43-faq v41-glass">
        {items.map((item, index) => {
          const panelId = `${baseId}-panel-${index}`;
          const buttonId = `${baseId}-button-${index}`;
          const isOpen = open === index;
          return (
            <div key={item.q} className="v43-faq-item">
              <h3>
                <button
                  type="button"
                  id={buttonId}
                  aria-expanded={isOpen}
                  aria-controls={panelId}
                  onClick={() => setOpen(isOpen ? -1 : index)}
                >
                  {item.q}
                  <ChevronDown size={18} />
                </button>
              </h3>
              {isOpen ? (
                <p id={panelId} role="region" aria-labelledby={buttonId} className="v43-faq-body">
                  {item.a}
                </p>
              ) : null}
            </div>
          );
        })}
      </div>
    </section>
  );
}
