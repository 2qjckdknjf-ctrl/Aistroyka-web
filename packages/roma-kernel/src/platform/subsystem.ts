import type { RomaEntityId, RomaOwnership, RomaStabilityLevel } from "../shared";
import type { RomaRiskLevel } from "../risk/risk-level";

export type RomaPlatformCategory =
  | "applications"
  | "infrastructure"
  | "data"
  | "ai"
  | "security"
  | "delivery"
  | "business"
  | "integrations";

export type RomaHealthSourceKind =
  | "live_probe"
  | "dashboard_component"
  | "platform_api"
  | "external_manual"
  | "unknown";

export type RomaSubsystem = {
  id: RomaEntityId;
  displayName: string;
  category: RomaPlatformCategory;
  healthSource: {
    kind: RomaHealthSourceKind;
    ref: string;
  };
  dependencies: readonly RomaEntityId[];
  riskLevel: RomaRiskLevel;
  releaseCritical: boolean;
  owner: RomaOwnership;
  documentation: readonly string[];
  stability: RomaStabilityLevel;
  notes?: string;
};

export type RomaPlatformSurface =
  | "web_public"
  | "web_dashboard"
  | "platform_admin"
  | "api"
  | "mobile_ios"
  | "mobile_android";

export type RomaPlatformCapability = {
  id: RomaEntityId;
  displayName: string;
  subsystemId: RomaEntityId;
  surface?: RomaPlatformSurface;
  stability: RomaStabilityLevel;
  documentation: readonly string[];
};

export type RomaPlatformOntology = {
  version: "1";
  subsystems: readonly RomaSubsystem[];
  capabilities: readonly RomaPlatformCapability[];
};
