/**
 * AI Brain Phase D — Version reference capture.
 * Repo-native version identity for prompts, policy, planner, tool registry, etc.
 */

import type { AiVersionRef } from "../run/run.types";

const LAYER_VERSION = "phase_d_v1";

export function captureVersionRefs(): AiVersionRef[] {
  return [
    { layer: "prompt", version: LAYER_VERSION },
    { layer: "policy", version: LAYER_VERSION },
    { layer: "planner", version: LAYER_VERSION },
    { layer: "tool_registry", version: LAYER_VERSION },
    { layer: "output_contract", version: LAYER_VERSION },
    { layer: "memory_retrieval", version: LAYER_VERSION },
    { layer: "orchestrator", version: LAYER_VERSION },
  ];
}
