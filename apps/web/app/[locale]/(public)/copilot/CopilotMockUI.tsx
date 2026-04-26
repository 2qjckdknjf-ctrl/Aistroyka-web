"use client";

import { useTranslations } from "next-intl";

export function CopilotMockUI() {
  const t = useTranslations("public.copilot");
  return (
    <div className="rounded-[var(--aistroyka-radius-card)] border border-[var(--aistroyka-border-subtle)] bg-[var(--aistroyka-surface)] shadow-[var(--aistroyka-shadow-e2)] overflow-hidden">
      <div className="border-b border-[var(--aistroyka-border-subtle)] bg-[var(--aistroyka-bg-primary)] px-4 py-3">
        <span className="text-[var(--aistroyka-font-subheadline)] font-semibold text-[var(--aistroyka-text-primary)]">
          {t("mockInterfaceTitle")}
        </span>
      </div>
      <div className="grid gap-0 md:grid-cols-2">
        <div className="flex flex-col border-b border-[var(--aistroyka-border-subtle)] md:border-b-0 md:border-r">
          <div className="flex-1 space-y-3 p-4">
            <div className="rounded-[var(--aistroyka-radius-lg)] bg-[var(--aistroyka-accent-light)] p-3 text-[var(--aistroyka-font-footnote)] text-[var(--aistroyka-text-primary)]">
              {t("mockUserMessage")}
            </div>
            <div className="rounded-[var(--aistroyka-radius-lg)] bg-[var(--aistroyka-surface-raised)] p-3 text-[var(--aistroyka-font-footnote)] text-[var(--aistroyka-text-secondary)]">
              {t("mockCopilotMessage")}
            </div>
          </div>
          <div className="border-t border-[var(--aistroyka-border-subtle)] p-3">
            <div className="rounded-[var(--aistroyka-radius-lg)] border border-[var(--aistroyka-border-subtle)] bg-[var(--aistroyka-surface)] px-3 py-2 text-[var(--aistroyka-font-caption)] text-[var(--aistroyka-text-tertiary)]">
              {t("mockInputPlaceholder")}
            </div>
          </div>
        </div>
        <div className="flex flex-col p-4 gap-3">
          <div>
            <span className="text-[var(--aistroyka-font-caption)] font-semibold text-[var(--aistroyka-text-tertiary)]">{t("mockProjectSummaryTitle")}</span>
            <div className="mt-1 rounded-[var(--aistroyka-radius-sm)] bg-[var(--aistroyka-bg-primary)] p-2 text-[var(--aistroyka-font-footnote)] text-[var(--aistroyka-text-secondary)]">
              {t("mockProjectSummaryBody")}
            </div>
          </div>
          <div>
            <span className="text-[var(--aistroyka-font-caption)] font-semibold text-[var(--aistroyka-text-tertiary)]">{t("mockRiskHighlightsTitle")}</span>
            <ul className="mt-1 space-y-1 text-[var(--aistroyka-font-footnote)] text-[var(--aistroyka-text-secondary)]">
              <li>{t("mockRiskItem1")}</li>
              <li>{t("mockRiskItem2")}</li>
            </ul>
          </div>
          <div>
            <span className="text-[var(--aistroyka-font-caption)] font-semibold text-[var(--aistroyka-text-tertiary)]">{t("mockActionItemsTitle")}</span>
            <ul className="mt-1 space-y-1 text-[var(--aistroyka-font-footnote)] text-[var(--aistroyka-text-secondary)]">
              <li>{t("mockActionItem1")}</li>
              <li>{t("mockActionItem2")}</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
