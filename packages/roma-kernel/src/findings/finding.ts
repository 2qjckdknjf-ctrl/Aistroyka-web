import type { RomaEntityId } from "../shared";
import type { RomaSeverity } from "../shared/severity";

export type RomaFinding = {
  id: RomaEntityId;
  title: string;
  severity: RomaSeverity;
  summary: string;
  evidenceRefs: readonly string[];
  sourceModule?: string;
};

export type RomaFindingGroup = {
  severity: RomaSeverity;
  findings: readonly RomaFinding[];
};
