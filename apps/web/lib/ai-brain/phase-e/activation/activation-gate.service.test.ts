/**
 * AI Brain Phase E — Activation gate tests.
 */

import { describe, it, expect } from "vitest";
import {
  evaluateActivationGate,
  LIVE_ACTIVATION_PERMITTED,
  canProceedToSandbox,
  isRejected,
} from "./activation-gate.service";
import type { AiOptimizationProposal, AiOptimizationDecision } from "../types";

describe("evaluateActivationGate", () => {
  const baseProposal: AiOptimizationProposal = {
    id: "p1",
    sourceCandidateId: "c1",
    tenantId: "t1",
    projectId: null,
    targetLayer: "planner",
    rationale: "test",
    linkedEvidenceRefs: [],
    expectedGain: null,
    riskLevel: "medium",
    readiness: "draft",
    reviewStatus: "pending",
    createdAt: new Date().toISOString(),
  };

  it("returns not_ready for draft proposal", () => {
    const gate = evaluateActivationGate({ proposal: baseProposal });
    expect(gate.gateState).toBe("not_ready");
    expect(gate.liveActivationPermitted).toBe(false);
  });

  it("liveActivationPermitted is always false", () => {
    const gate = evaluateActivationGate({
      proposal: { ...baseProposal, reviewStatus: "approved" },
      latestDecision: {
        id: "d1",
        proposalId: "p1",
        packageId: null,
        experimentId: null,
        decisionType: "approve_for_canary",
        reviewerId: null,
        reason: null,
        createdAt: new Date().toISOString(),
      },
    });
    expect(gate.liveActivationPermitted).toBe(LIVE_ACTIVATION_PERMITTED);
    expect(gate.liveActivationPermitted).toBe(false);
  });

  it("returns rejected when decision is reject", () => {
    const decision: AiOptimizationDecision = {
      id: "d1",
      proposalId: "p1",
      packageId: null,
      experimentId: null,
      decisionType: "reject",
      reviewerId: null,
      reason: null,
      createdAt: new Date().toISOString(),
    };
    const gate = evaluateActivationGate({
      proposal: baseProposal,
      latestDecision: decision,
    });
    expect(gate.gateState).toBe("rejected");
  });
});

describe("canProceedToSandbox", () => {
  it("returns true for approved_sandbox", () => {
    expect(
      canProceedToSandbox({ gateState: "approved_sandbox", liveActivationPermitted: false })
    ).toBe(true);
  });

  it("returns false for not_ready", () => {
    expect(
      canProceedToSandbox({ gateState: "not_ready", liveActivationPermitted: false })
    ).toBe(false);
  });
});

describe("isRejected", () => {
  it("returns true for rejected", () => {
    expect(isRejected({ gateState: "rejected", liveActivationPermitted: false })).toBe(true);
  });

  it("returns true for needs_revision", () => {
    expect(isRejected({ gateState: "needs_revision", liveActivationPermitted: false })).toBe(true);
  });

  it("returns false for approved_sandbox", () => {
    expect(isRejected({ gateState: "approved_sandbox", liveActivationPermitted: false })).toBe(
      false
    );
  });
});
