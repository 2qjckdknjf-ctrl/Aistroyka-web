/** Branded-style identifiers — plain strings at runtime, documented in kernel. */
export type RomaEntityId = string;

export type RomaSubsystemId = RomaEntityId;

export type RomaCapabilityId = RomaEntityId;

export type RomaModuleId =
  | "executive-dashboard"
  | "safe-audit"
  | "audit-history"
  | "engineering-intelligence"
  | "quality-graph"
  | "test-catalog"
  | "change-intelligence"
  | "execution-planner"
  | "execution-engine"
  | "platform-registry";
