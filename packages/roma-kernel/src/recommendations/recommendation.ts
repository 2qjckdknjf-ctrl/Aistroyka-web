import type { RomaEntityId } from "../shared";
import type { RomaSeverity } from "../shared/severity";

export type RomaRecommendation = {
  id: RomaEntityId;
  title: string;
  summary: string;
  severity?: RomaSeverity;
  evidence: string;
  sourceModule?: string;
};
