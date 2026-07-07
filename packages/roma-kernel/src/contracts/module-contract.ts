import type { RomaModuleId } from "../shared/ids";
import type { RomaStabilityLevel } from "../shared/stability";

/** Metadata contract every ROMA module must satisfy when adopting kernel types. */
export type RomaModuleContract = {
  moduleId: RomaModuleId;
  kernelVersion: "1";
  stability: RomaStabilityLevel;
  documentation: readonly string[];
  /** Kernel entity types this module consumes — not implementation imports. */
  consumes: readonly RomaKernelEntityKind[];
};

export type RomaKernelEntityKind =
  | "subsystem"
  | "capability"
  | "evidence"
  | "finding"
  | "recommendation"
  | "release"
  | "risk"
  | "dependency"
  | "health"
  | "decision"
  | "audit"
  | "change"
  | "test_domain"
  | "graph";

export type RomaEntityMetadata = {
  id: string;
  displayName: string;
  stability: RomaStabilityLevel;
  documentation: readonly string[];
  owner?: import("../shared/ownership").RomaOwnership;
};

export const ROMA_KERNEL_VERSION = "1" as const;

/** Modules that must depend on kernel (documentation enforcement list). */
export const ROMA_KERNEL_CONSUMER_MODULES: readonly RomaModuleId[] = [
  "executive-dashboard",
  "safe-audit",
  "audit-history",
  "engineering-intelligence",
  "quality-graph",
  "test-catalog",
  "change-intelligence",
  "execution-planner",
  "execution-engine",
  "platform-registry",
] as const;
