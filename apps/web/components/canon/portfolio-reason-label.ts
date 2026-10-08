const PORTFOLIO_REASON_KEYS = {
  "No major operational pressures from current signals.": "portfolioReasonHealthy",
  "Budget: actual exceeds planned.": "portfolioReasonBudgetOver",
  "Budget pressure — spending close to limit or line overruns.": "portfolioReasonBudgetPressure",
  "Budget signals need review.": "portfolioReasonBudgetReview",
  "Punch list items block handover until cleared.": "portfolioReasonPunchList",
  "Schedule: overdue milestones.": "portfolioReasonSchedule",
  "Documents awaiting approval.": "portfolioReasonApprovals",
  "Client requests need a response.": "portfolioReasonClientRequests",
  "Open change orders in flight.": "portfolioReasonChangeOrders",
  "Open stakeholder discussions.": "portfolioReasonDiscussions",
  "Handover readiness blocked — see project handover panel.": "portfolioReasonHandover",
  "Active aftercare / warranty requests.": "portfolioReasonAftercare",
  "Open project issues.": "portfolioReasonIssues",
  "Field reports awaiting review.": "portfolioReasonReports",
  "Multiple risk signals — review project summary.": "portfolioReasonCritical",
  "Some follow-up recommended.": "portfolioReasonFollowUp",
} as const;

export type PortfolioReasonMessageKey = (typeof PORTFOLIO_REASON_KEYS)[keyof typeof PORTFOLIO_REASON_KEYS];

export function portfolioReasonMessageKey(reason: string | null | undefined): PortfolioReasonMessageKey | null {
  if (!reason) return null;
  return PORTFOLIO_REASON_KEYS[reason as keyof typeof PORTFOLIO_REASON_KEYS] ?? null;
}

/** Visible cell text and tooltip must be the same localized string. */
export function portfolioReasonCell(
  reason: string | null | undefined,
  translate: (key: PortfolioReasonMessageKey) => string,
): { text: string; title: string } {
  const key = portfolioReasonMessageKey(reason);
  const text = key ? translate(key) : (reason ?? "—");
  return { text, title: text };
}
