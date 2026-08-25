"use client";

import { useTranslations } from "next-intl";

export function CopilotMockUI() {
  const t = useTranslations("public.copilot");
  return (
    <article className="v43-plan-card v41-glass">
      <h3>{t("mockInterfaceTitle")}</h3>
      <div className="v43-two-col">
        <div>
          <p>{t("mockUserMessage")}</p>
          <p>{t("mockCopilotMessage")}</p>
          <p className="v41-eyebrow">{t("mockInputPlaceholder")}</p>
        </div>
        <div>
          <h4>{t("mockProjectSummaryTitle")}</h4>
          <p>{t("mockProjectSummaryBody")}</p>
          <h4>{t("mockRiskHighlightsTitle")}</h4>
          <ul>
            <li>{t("mockRiskItem1")}</li>
            <li>{t("mockRiskItem2")}</li>
          </ul>
          <h4>{t("mockActionItemsTitle")}</h4>
          <ul>
            <li>{t("mockActionItem1")}</li>
            <li>{t("mockActionItem2")}</li>
          </ul>
        </div>
      </div>
    </article>
  );
}
