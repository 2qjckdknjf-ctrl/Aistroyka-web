import type { RomaEntityId } from "../shared";
import type { RomaStabilityLevel } from "../shared/stability";

export type RomaCapabilityKind = "surface" | "integration" | "probe" | "analysis" | "policy";

export type RomaCapability = {
  id: RomaEntityId;
  displayName: string;
  kind: RomaCapabilityKind;
  moduleId?: string;
  stability: RomaStabilityLevel;
  documentation: readonly string[];
};
