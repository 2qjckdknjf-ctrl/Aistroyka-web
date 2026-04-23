/**
 * AI Brain Phase E — Activation gate logic.
 * Nothing becomes live without explicit gating. Phase E: live activation NOT permitted.
 */

import type {
  AiOptimizationProposal,
  AiOptimizationPackage,
  AiOptimizationExperiment,
  AiOptimizationDecision,
  AiOptimizationActivationGate,
  GateState,
  DecisionType,
} from "../types";
import { GATE_STATES } from "../types";

/** Phase E: live activation is never permitted. */
export const LIVE_ACTIVATION_PERMITTED = false;

export function evaluateActivationGate(params: {
  proposal: AiOptimizationProposal;
  package?: AiOptimizationPackage | null;
  experiment?: AiOptimizationExperiment | null;
  latestDecision?: AiOptimizationDecision | null;
}): AiOptimizationActivationGate {
  const { proposal, package: pkg, experiment, latestDecision } = params;

  if (latestDecision) {
    switch (latestDecision.decisionType) {
      case "reject":
        return { gateState: "rejected", liveActivationPermitted: LIVE_ACTIVATION_PERMITTED };
      case "revise":
        return { gateState: "needs_revision", liveActivationPermitted: LIVE_ACTIVATION_PERMITTED };
      case "hold":
        return { gateState: "ready_for_review", liveActivationPermitted: LIVE_ACTIVATION_PERMITTED };
      case "approve_for_canary":
        return {
          gateState: "approved_canary_prep",
          liveActivationPermitted: LIVE_ACTIVATION_PERMITTED,
        };
      default:
        break;
    }
  }

  if (proposal.reviewStatus === "rejected") {
    return { gateState: "rejected", liveActivationPermitted: LIVE_ACTIVATION_PERMITTED };
  }

  if (proposal.reviewStatus === "approved" && pkg?.reviewStatus === "approved") {
    if (experiment?.status === "completed") {
      return {
        gateState: "approved_canary_prep",
        liveActivationPermitted: LIVE_ACTIVATION_PERMITTED,
      };
    }
    return {
      gateState: "approved_sandbox",
      liveActivationPermitted: LIVE_ACTIVATION_PERMITTED,
    };
  }

  if (proposal.readiness === "ready_for_review" || pkg) {
    return { gateState: "ready_for_review", liveActivationPermitted: LIVE_ACTIVATION_PERMITTED };
  }

  return { gateState: "not_ready", liveActivationPermitted: LIVE_ACTIVATION_PERMITTED };
}

export function canProceedToSandbox(gate: AiOptimizationActivationGate): boolean {
  return (
    gate.gateState === "approved_sandbox" ||
    gate.gateState === "approved_canary_prep" ||
    gate.gateState === "ready_for_review"
  );
}

export function isRejected(gate: AiOptimizationActivationGate): boolean {
  return gate.gateState === "rejected" || gate.gateState === "needs_revision";
}

export function validateGateState(v: unknown): v is GateState {
  return typeof v === "string" && GATE_STATES.includes(v as GateState);
}
