/**
 * Agentic metrics. No PII in labels.
 */

import { logStructured } from "@/lib/observability/logger";

export function logAgentMetric(event: string, payload: Record<string, unknown>): void {
  logStructured({
    event,
    component: "agentic",
    ...payload,
  });
}
