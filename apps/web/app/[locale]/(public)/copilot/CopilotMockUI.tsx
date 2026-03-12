"use client";

export function CopilotMockUI() {
  return (
    <div className="rounded-[var(--aistroyka-radius-card)] border border-[var(--aistroyka-border-subtle)] bg-[var(--aistroyka-surface)] shadow-[var(--aistroyka-shadow-e2)] overflow-hidden">
      <div className="border-b border-[var(--aistroyka-border-subtle)] bg-[var(--aistroyka-bg-primary)] px-4 py-3">
        <span className="text-[var(--aistroyka-font-subheadline)] font-semibold text-[var(--aistroyka-text-primary)]">
          AI Copilot — mock interface
        </span>
      </div>
      <div className="grid gap-0 md:grid-cols-2">
        <div className="flex flex-col border-b border-[var(--aistroyka-border-subtle)] md:border-b-0 md:border-r">
          <div className="flex-1 space-y-3 p-4">
            <div className="rounded-[var(--aistroyka-radius-lg)] bg-[var(--aistroyka-accent-light)] p-3 text-[var(--aistroyka-font-footnote)] text-[var(--aistroyka-text-primary)]">
              User: What’s the status of Block A this week?
            </div>
            <div className="rounded-[var(--aistroyka-radius-lg)] bg-[var(--aistroyka-surface-raised)] p-3 text-[var(--aistroyka-font-footnote)] text-[var(--aistroyka-text-secondary)]">
              Copilot: Block A is 72% complete. 2 reports pending. One delay risk (weather). Recommendation: confirm foundation sign-off before next phase.
            </div>
          </div>
          <div className="border-t border-[var(--aistroyka-border-subtle)] p-3">
            <div className="rounded-[var(--aistroyka-radius-lg)] border border-[var(--aistroyka-border-subtle)] bg-[var(--aistroyka-surface)] px-3 py-2 text-[var(--aistroyka-font-caption)] text-[var(--aistroyka-text-tertiary)]">
              Ask about project status…
            </div>
          </div>
        </div>
        <div className="flex flex-col p-4 gap-3">
          <div>
            <span className="text-[var(--aistroyka-font-caption)] font-semibold text-[var(--aistroyka-text-tertiary)]">Project summary</span>
            <div className="mt-1 rounded-[var(--aistroyka-radius-sm)] bg-[var(--aistroyka-bg-primary)] p-2 text-[var(--aistroyka-font-footnote)] text-[var(--aistroyka-text-secondary)]">
              On track overall. 3 risks open. 1 overdue task.
            </div>
          </div>
          <div>
            <span className="text-[var(--aistroyka-font-caption)] font-semibold text-[var(--aistroyka-text-tertiary)]">Risk highlights</span>
            <ul className="mt-1 space-y-1 text-[var(--aistroyka-font-footnote)] text-[var(--aistroyka-text-secondary)]">
              <li>• Weather delay possible (medium)</li>
              <li>• Missing photo evidence — Lot 2 (low)</li>
            </ul>
          </div>
          <div>
            <span className="text-[var(--aistroyka-font-caption)] font-semibold text-[var(--aistroyka-text-tertiary)]">Action items</span>
            <ul className="mt-1 space-y-1 text-[var(--aistroyka-font-footnote)] text-[var(--aistroyka-text-secondary)]">
              <li>• Review Block A foundation sign-off</li>
              <li>• Request photo update for Lot 2</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
