"use client";

import { useEffect, useMemo, useState } from "react";

export type LegalSection = {
  id: string;
  title: string;
  body: string[];
  bullets?: string[];
  callout?: string;
};

export function LegalDocument({
  title,
  updated,
  intro,
  progressLabel,
  summaryTitle,
  summaryItems,
  sections,
  nextLabel,
}: {
  title: string;
  updated: string;
  intro: string;
  progressLabel: string;
  summaryTitle: string;
  summaryItems: string[];
  sections: LegalSection[];
  nextLabel: string;
}) {
  const [progress, setProgress] = useState(0);
  const [active, setActive] = useState(sections[0]?.id ?? "");
  const ids = useMemo(() => sections.map((section) => section.id), [sections]);

  useEffect(() => {
    function onScroll() {
      const article = document.getElementById("v43-legal-article");
      if (!article) return;
      const rect = article.getBoundingClientRect();
      const total = article.offsetHeight - window.innerHeight;
      const passed = Math.min(Math.max(-rect.top, 0), Math.max(total, 1));
      setProgress(Math.round((passed / Math.max(total, 1)) * 100));
      let current = ids[0] ?? "";
      for (const id of ids) {
        const el = document.getElementById(id);
        if (el && el.getBoundingClientRect().top <= 140) current = id;
      }
      setActive(current);
    }
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, [ids]);

  const activeIndex = Math.max(0, ids.indexOf(active));
  const next = sections[activeIndex + 1];

  return (
    <div className="v43-legal v41-page v43-legal-layout">
      <nav className="v43-legal-toc v43-sticky-card v41-glass" aria-label={progressLabel}>
        <p className="v41-eyebrow">{progressLabel}</p>
        <p>{progress}%</p>
        <div className="v43-progress" aria-hidden>
          <span style={{ width: `${progress}%` }} />
        </div>
        <ol>
          {sections.map((section, index) => (
            <li key={section.id}>
              <a className={active === section.id ? "is-active" : undefined} href={`#${section.id}`}>
                {index + 1}. {section.title}
              </a>
            </li>
          ))}
        </ol>
      </nav>
      <article id="v43-legal-article">
        <h1>{title}</h1>
        <p>{updated}</p>
        <p>{intro}</p>
        {sections.map((section) => (
          <section key={section.id} id={section.id}>
            <h2>{section.title}</h2>
            {section.body.map((paragraph) => (
              <p key={paragraph}>{paragraph}</p>
            ))}
            {section.bullets ? (
              <ul>
                {section.bullets.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            ) : null}
            {section.callout ? <p className="v43-callout v41-glass">{section.callout}</p> : null}
          </section>
        ))}
        {next ? (
          <p>
            <a href={`#${next.id}`}>
              {nextLabel}: {next.title}
            </a>
          </p>
        ) : null}
      </article>
      <aside className="v43-legal-aside v43-sticky-card v41-glass">
        <h2>{summaryTitle}</h2>
        <ul>
          {summaryItems.map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ul>
      </aside>
    </div>
  );
}
