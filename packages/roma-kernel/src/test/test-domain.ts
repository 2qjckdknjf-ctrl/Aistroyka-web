/** Canonical test catalog domain — single source for change intel + catalog. */
export type RomaTestDomain =
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

export type RomaTestPriority = "p0" | "p1" | "p2" | "p3";

export type RomaBusinessAreaId = string;

export type RomaProductAreaId = string;
