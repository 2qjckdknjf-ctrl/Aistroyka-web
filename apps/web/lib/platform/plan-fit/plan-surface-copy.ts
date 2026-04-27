/**
 * Canonical plan display copy.
 * Step 10: human-readable names, descriptions, upgrade CTA.
 */

import type { PlanCode } from "@aistroyka/contracts";
import type { PlanDisplayCopy } from "./plan-surface.types";

export const PLAN_DISPLAY_COPY: Record<PlanCode, PlanDisplayCopy> = {
  client_personal: {
    name: "Client Personal",
    descriptionShort: "For clients and small project owners. Transparency, reports, and approvals.",
    featureBullets: [
      "Projects and phases",
      "Photo evidence and reports",
      "Approvals and documents",
      "Basic dashboard",
    ],
  },
  team_contractor: {
    name: "Team Contractor",
    descriptionShort: "For contractor teams. Tasks, mobile workers, and basic AI insights.",
    featureBullets: [
      "Projects and tasks",
      "Mobile worker flow",
      "Daily reports",
      "Manager AI (basic)",
    ],
  },
  business_operations: {
    name: "Business Operations",
    descriptionShort: "For growing operations. Advanced analytics, portfolio view, integrations.",
    featureBullets: [
      "Projects and tasks",
      "Advanced approvals",
      "Portfolio analytics",
      "Integrations and API",
    ],
  },
  enterprise: {
    name: "Enterprise",
    descriptionShort: "For large organizations. SSO, audit logs, SLA, white-glove support.",
    featureBullets: [
      "All Business features",
      "SSO and audit logs",
      "SLA and priority support",
      "Managed onboarding",
    ],
  },
};

/** Upgrade CTA copy by variant. No checkout/billing promises. */
export const UPGRADE_CTA_COPY: Record<string, { cta: string; learnMore: string }> = {
  explore_plans: {
    cta: "Explore plan options",
    learnMore: "See what's included in higher plans",
  },
  see_business_options: {
    cta: "Explore Business Operations",
    learnMore: "Advanced analytics, portfolio view, and integrations",
  },
  contact_enterprise: {
    cta: "Contact us for enterprise rollout",
    learnMore: "SSO, audit logs, SLA, and managed support",
  },
  managed_plan: {
    cta: "Contact support or onboarding team",
    learnMore: "Managed plan options",
  },
  none: {
    cta: "",
    learnMore: "",
  },
};
