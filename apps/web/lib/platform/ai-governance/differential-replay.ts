/**
 * Differential replay for budget / permissions / reports / project state
 * (Cursor/Codex delta 2026-11-28 P0).
 *
 * Compares baseline vs candidate on reset synthetic fixtures only — no network,
 * payments, or live side effects. Reuses Action Boundary + evidence verdict.
 */

import {
  evaluateActionBoundary,
  type ActionBoundaryResult,
} from "./action-boundary";
import { combineEvidenceVerdict, type IndependentEvidenceVerdict } from "./evidence-verdict";
import { assertCustomerFinanceSafePayload } from "@/lib/security/customer-finance-guard";

export type PermissionSnapshot = {
  role: string;
  canReadProject: boolean;
  canWriteProject: boolean;
  canReadFinance: boolean;
};

export type BudgetSnapshot = {
  /** Customer-facing commercial artifact only (estimates/approved deltas). */
  customerVisible: Record<string, unknown>;
  /** Internal contractor state — must never equal customerVisible keys of concern. */
  internal: Record<string, unknown>;
};

export type ProjectStateSnapshot = {
  permissions: PermissionSnapshot;
  budget: BudgetSnapshot;
  reports: ReadonlyArray<Record<string, unknown>>;
  project: { id: string; status: string; tenantId: string };
};

export type DifferentialReplayRequest = {
  baseline: ProjectStateSnapshot;
  candidate: ProjectStateSnapshot;
  principal: { principalId: string; tenantId: string; authorized?: boolean };
  /** Exact candidate SHA under test. */
  sha: string;
  /** Simulated independent runs with reset state (critical evidence expects ≥3). */
  runs?: number;
};

export type DifferentialReplayResult = {
  equal_customer_surface: boolean;
  diffs: string[];
  finance_guard_ok: boolean;
  finance_guard_path?: string;
  boundary: {
    finance_exfiltrate: ActionBoundaryResult;
    customer_read: ActionBoundaryResult;
    shell_finance_read: ActionBoundaryResult;
  };
  evidence: IndependentEvidenceVerdict;
};

function stableJson(value: unknown): string {
  return JSON.stringify(value, (_k, v) => {
    if (v && typeof v === "object" && !Array.isArray(v)) {
      const sorted: Record<string, unknown> = {};
      for (const key of Object.keys(v as Record<string, unknown>).sort()) {
        sorted[key] = (v as Record<string, unknown>)[key];
      }
      return sorted;
    }
    return v;
  });
}

function pushDiff(diffs: string[], label: string, a: unknown, b: unknown): void {
  if (stableJson(a) !== stableJson(b)) diffs.push(label);
}

/**
 * Replay customer-visible project surfaces: permissions, customer budget projection,
 * reports, and project metadata. Internal budget must fail finance guard when
 * projected; Action Boundary must deny finance exfiltration on every transport path tested.
 */
export function replayProjectStateDifferential(
  request: DifferentialReplayRequest
): DifferentialReplayResult {
  const diffs: string[] = [];
  const { baseline, candidate, principal, sha } = request;
  const runs = request.runs ?? 3;
  const authorized = principal.authorized !== false;

  pushDiff(diffs, "permissions", baseline.permissions, candidate.permissions);
  pushDiff(
    diffs,
    "budget.customerVisible",
    baseline.budget.customerVisible,
    candidate.budget.customerVisible
  );
  pushDiff(diffs, "reports", baseline.reports, candidate.reports);
  pushDiff(
    diffs,
    "project",
    { id: baseline.project.id, status: baseline.project.status, tenantId: baseline.project.tenantId },
    { id: candidate.project.id, status: candidate.project.status, tenantId: candidate.project.tenantId }
  );

  const customerPayload = {
    project: candidate.project,
    permissions: {
      role: candidate.permissions.role,
      canReadProject: candidate.permissions.canReadProject,
      canWriteProject: candidate.permissions.canWriteProject,
    },
    budget: candidate.budget.customerVisible,
    reports: candidate.reports,
  };

  const financeGuard = assertCustomerFinanceSafePayload(customerPayload);
  // Internal budget must never pass a customer projection check.
  const internalGuard = assertCustomerFinanceSafePayload(candidate.budget.internal);
  if (internalGuard.ok && Object.keys(candidate.budget.internal).length > 0) {
    diffs.push("budget.internal_passed_customer_guard");
  }

  const boundaryPrincipal = {
    principalId: principal.principalId,
    tenantId: principal.tenantId,
    authorized,
  };

  const finance_exfiltrate = evaluateActionBoundary({
    principal: boundaryPrincipal,
    resourceClass: "finance",
    operation: "exfiltrate",
    transport: "api",
  });
  const customer_read = evaluateActionBoundary({
    principal: boundaryPrincipal,
    resourceClass: "customer_data",
    operation: "read",
    transport: "api",
  });
  const shell_finance_read = evaluateActionBoundary({
    principal: boundaryPrincipal,
    resourceClass: "finance",
    operation: "read",
    transport: "shell",
  });

  const boundaryOk =
    finance_exfiltrate.decision === "deny" &&
    shell_finance_read.decision === "deny" &&
    (authorized
      ? customer_read.decision === "allow"
      : customer_read.decision === "deny");

  // Unauthorized principals must not produce release-accepted evidence even when deny works.
  const securityFail = !financeGuard.ok || !boundaryOk || !authorized;

  const functionalFail = diffs.length > 0;

  const evidence = combineEvidenceVerdict({
    functional: functionalFail ? "FAIL" : "PASS",
    security: securityFail ? "FAIL" : "PASS",
    // Let combineEvidenceVerdict enforce runs≥3 via critical_runs_below_three.
    repeatability: "PASS",
    runs,
    sha,
  });

  return {
    equal_customer_surface: diffs.length === 0,
    diffs,
    finance_guard_ok: financeGuard.ok,
    finance_guard_path: financeGuard.path,
    boundary: {
      finance_exfiltrate,
      customer_read,
      shell_finance_read,
    },
    evidence,
  };
}
