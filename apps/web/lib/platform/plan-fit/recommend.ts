/**
 * Plan recommendation engine (pure domain layer).
 * Rules documented in docs/product/PLAN_RECOMMENDATION_RULES.md.
 */

import type { PlanCode } from "@aistroyka/contracts";
import type {
  RecommendPlanInput,
  RecommendPlanOutput,
  ExpectedUsersRange,
} from "./recommend.types";

const ALL_PLANS: PlanCode[] = [
  "client_personal",
  "team_contractor",
  "business_operations",
  "enterprise",
];

function alternatives(primary: PlanCode): PlanCode[] {
  return ALL_PLANS.filter((p) => p !== primary);
}

/** High scale: 21_100 or 100_plus users. */
function isHighScaleUsers(range: ExpectedUsersRange): boolean {
  return range === "21_100" || range === "100_plus";
}

/** Small scale: 1 or 2_5 users. */
function isSmallScaleUsers(range: ExpectedUsersRange): boolean {
  return range === "1" || range === "2_5";
}

/** Many projects: 6_20 or 20_plus. */
function isManyProjects(range: string): boolean {
  return range === "6_20" || range === "20_plus";
}

export function recommendPlan(input: RecommendPlanInput): RecommendPlanOutput {
  const reasons: string[] = [];
  const { personaType, expectedUsersRange, expectedProjectsRange, priorities, needsMobileWorkforce, needsFormalProcesses, startMode } = input;

  // Enterprise: high scale or demo/assisted
  if (expectedUsersRange === "100_plus") {
    reasons.push("scale_100_plus_users");
    return {
      recommendedPlanCode: "enterprise",
      alternativePlanCodes: alternatives("enterprise"),
      enterpriseSignal: true,
      reasoningCodes: reasons,
    };
  }
  if (isHighScaleUsers(expectedUsersRange) && startMode === "demo") {
    reasons.push("scale_21_100_and_demo");
    return {
      recommendedPlanCode: "enterprise",
      alternativePlanCodes: alternatives("enterprise"),
      enterpriseSignal: true,
      reasoningCodes: reasons,
    };
  }
  if (isHighScaleUsers(expectedUsersRange) && needsFormalProcesses) {
    reasons.push("scale_21_100_formal_processes");
    return {
      recommendedPlanCode: "enterprise",
      alternativePlanCodes: alternatives("enterprise"),
      enterpriseSignal: true,
      reasoningCodes: reasons,
    };
  }

  // Business operations: multi-project, governance, approvals/documents/analytics
  const wantsGovernance =
    needsFormalProcesses ||
    priorities.includes("approvals_documents") ||
    priorities.includes("quality_defects") ||
    priorities.includes("ai_insights");
  if (
    (personaType === "supervisor" || personaType === "developer_owner") &&
    isManyProjects(expectedProjectsRange) &&
    wantsGovernance
  ) {
    reasons.push("supervisor_or_owner_multi_project_governance");
    return {
      recommendedPlanCode: "business_operations",
      alternativePlanCodes: alternatives("business_operations"),
      enterpriseSignal: false,
      reasoningCodes: reasons,
    };
  }
  if (
    expectedUsersRange === "6_20" &&
    expectedProjectsRange === "20_plus" &&
    wantsGovernance
  ) {
    reasons.push("multi_project_governance");
    return {
      recommendedPlanCode: "business_operations",
      alternativePlanCodes: alternatives("business_operations"),
      enterpriseSignal: false,
      reasoningCodes: reasons,
    };
  }

  // Team contractor: contractor persona, 2–20 users, mobile workforce, execution
  if (
    personaType === "contractor" &&
    (expectedUsersRange === "2_5" || expectedUsersRange === "6_20") &&
    needsMobileWorkforce
  ) {
    reasons.push("contractor_mobile_workforce");
    return {
      recommendedPlanCode: "team_contractor",
      alternativePlanCodes: alternatives("team_contractor"),
      enterpriseSignal: false,
      reasoningCodes: reasons,
    };
  }
  if (
    (expectedUsersRange === "2_5" || expectedUsersRange === "6_20") &&
    needsMobileWorkforce &&
    priorities.some((p) => p === "execution_control" || p === "reports_photo")
  ) {
    reasons.push("execution_reports_mobile");
    return {
      recommendedPlanCode: "team_contractor",
      alternativePlanCodes: alternatives("team_contractor"),
      enterpriseSignal: false,
      reasoningCodes: reasons,
    };
  }

  // Client personal: small scale, 1–2 users, 1–2 projects, transparency/photo, no complex workforce
  if (
    (personaType === "client" || personaType === "other") &&
    isSmallScaleUsers(expectedUsersRange) &&
    (expectedProjectsRange === "1" || expectedProjectsRange === "2_5") &&
    !needsMobileWorkforce &&
    !needsFormalProcesses
  ) {
    reasons.push("client_small_scale_transparency");
    return {
      recommendedPlanCode: "client_personal",
      alternativePlanCodes: alternatives("client_personal"),
      enterpriseSignal: false,
      reasoningCodes: reasons,
    };
  }
  if (
    expectedUsersRange === "1" &&
    expectedProjectsRange === "1" &&
    !needsMobileWorkforce
  ) {
    reasons.push("single_user_single_project");
    return {
      recommendedPlanCode: "client_personal",
      alternativePlanCodes: alternatives("client_personal"),
      enterpriseSignal: false,
      reasoningCodes: reasons,
    };
  }

  // Default by scale
  if (isHighScaleUsers(expectedUsersRange)) {
    reasons.push("default_scale_21_100");
    return {
      recommendedPlanCode: "business_operations",
      alternativePlanCodes: alternatives("business_operations"),
      enterpriseSignal: false,
      reasoningCodes: reasons,
    };
  }
  if (expectedUsersRange === "6_20" || expectedProjectsRange === "6_20" || expectedProjectsRange === "20_plus") {
    reasons.push("default_mid_scale");
    return {
      recommendedPlanCode: "team_contractor",
      alternativePlanCodes: alternatives("team_contractor"),
      enterpriseSignal: false,
      reasoningCodes: reasons,
    };
  }

  reasons.push("default_small_scale");
  return {
    recommendedPlanCode: "client_personal",
    alternativePlanCodes: alternatives("client_personal"),
    enterpriseSignal: false,
    reasoningCodes: reasons,
  };
}
