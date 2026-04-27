/**
 * AI Brain Phase A — Tool adapter types.
 */

import type { ProjectTruthSnapshot } from "../truth-snapshot";

export interface ToolInput {
  projectId: string;
  tenantId: string;
  snapshot: ProjectTruthSnapshot;
}

export interface ToolResult<T = unknown> {
  available: boolean;
  data?: T;
  degradationReason?: string;
}

export type ToolExecutor = (
  supabase: import("@supabase/supabase-js").SupabaseClient,
  input: ToolInput
) => Promise<ToolResult>;
