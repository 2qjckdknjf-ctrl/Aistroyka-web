import type { RomaEntityId } from "../shared";
import type { RomaHealthStatus, RomaProbeConnectionStatus } from "../shared/status";

export type RomaProbeRef = {
  id: RomaEntityId;
  label: string;
  category: string;
};

export type RomaProbeEvidence = {
  probeId: RomaEntityId;
  connected: boolean;
  connectionStatus: RomaProbeConnectionStatus;
  summary: string;
  checkedAt: string;
  error: string | null;
};

export type RomaComponentHealth = {
  componentId: RomaEntityId;
  name: string;
  status: RomaHealthStatus;
  statusLabel: string;
  lastCheck: string;
  details?: string;
};

export type RomaHealthSnapshot = {
  capturedAt: string;
  probes: readonly RomaProbeEvidence[];
  components: readonly RomaComponentHealth[];
};
