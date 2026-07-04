/** ROMA Test Catalog domain (V1). */
export type RomaTestCatalogDomain =
  | "web"
  | "backend"
  | "database"
  | "security"
  | "ai"
  | "mobile_ios"
  | "mobile_android"
  | "performance"
  | "accessibility"
  | "ux"
  | "visual"
  | "release"
  | "pilot"
  | "business_flow";

export type RomaTestCatalogPriority = "p0" | "p1" | "p2" | "p3";

export type RomaTestCatalogSeverity = "critical" | "high" | "medium" | "low";

export type RomaTestCatalogExecutionType =
  | "automated"
  | "manual"
  | "smoke"
  | "audit"
  | "probe";

export type RomaTestCatalogPlatform =
  | "web"
  | "ios"
  | "android"
  | "api"
  | "staging"
  | "production";

export type RomaTestCatalogRole =
  | "platform_owner"
  | "tenant_owner"
  | "tenant_admin"
  | "manager"
  | "foreman"
  | "worker"
  | "client"
  | "stakeholder"
  | "anonymous";

export type RomaTestCatalogMaturity = "planned" | "defined" | "partial" | "live";

export type RomaTestCatalogItem = {
  testId: string;
  title: string;
  description: string;
  domain: RomaTestCatalogDomain;
  category: string;
  priority: RomaTestCatalogPriority;
  severity: RomaTestCatalogSeverity;
  executionType: RomaTestCatalogExecutionType;
  supportedPlatforms: readonly RomaTestCatalogPlatform[];
  supportedRoles: readonly RomaTestCatalogRole[];
  requiredEvidence: readonly string[];
  affectedModules: readonly string[];
  relatedGraphNodes: readonly string[];
  releaseCritical: boolean;
  estimatedRuntime: string;
  prerequisites: readonly string[];
  outputs: readonly string[];
  maturity: RomaTestCatalogMaturity;
  enabled: false;
};

export type RomaTestCatalog = {
  version: "v1";
  executionEnabled: false;
  generatedAt: string;
  items: readonly RomaTestCatalogItem[];
};

export type RomaTestCatalogSummary = {
  total: number;
  enabledCount: number;
  releaseCriticalCount: number;
  countsByDomain: Record<RomaTestCatalogDomain, number>;
  countsByPriority: Record<RomaTestCatalogPriority, number>;
  countsByMaturity: Record<RomaTestCatalogMaturity, number>;
};
