import type { RomaEntityId } from "../shared";
import type { RomaHealthStatus } from "../shared/status";

/** Canonical evidence item — metadata only, no probe implementation. */
export type RomaEvidence = {
  id: RomaEntityId;
  sourceId: string;
  label: string;
  summary: string;
  status?: RomaHealthStatus;
  capturedAt?: string;
  details?: string;
};

export type RomaEvidenceBundle = {
  bundleId: RomaEntityId;
  capturedAt: string;
  items: readonly RomaEvidence[];
};

export type RomaSignal = {
  id: RomaEntityId;
  kind: "probe" | "metric" | "audit" | "manual" | "derived";
  sourceRef: string;
  summary: string;
  observedAt: string;
};
