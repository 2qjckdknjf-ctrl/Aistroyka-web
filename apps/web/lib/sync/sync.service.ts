/**
 * Sync service: bootstrap and change aggregation. No direct DB in routes.
 */

import type { SupabaseClient } from "@supabase/supabase-js";
import type { TenantContext } from "@/lib/tenant/tenant.types";
import { listTasksForToday } from "@/lib/domain/tasks/task.service";
import { listForBootstrap as listReportsForBootstrap } from "@/lib/domain/reports/report.repository";
import { listForBootstrap as listUploadSessionsForBootstrap } from "@/lib/domain/upload-session/upload-session.repository";
import { getMaxCursor } from "./change-log.repository";

export interface BootstrapResult {
  data: {
    tasks: Array<{ id: string; [k: string]: unknown }>;
    reports: Array<{ id: string; status: string; created_at: string; submitted_at: string | null }>;
    uploadSessions: Array<{ id: string; status: string; created_at: string; purpose: string }>;
  };
  cursor: number;
  serverTime: string;
}

/**
 * Return initial minimal snapshot (tasks, reports, upload sessions for user) + cursor.
 * Same shape as GET /api/v1/sync/bootstrap response body.
 */
export async function bootstrap(
  supabase: SupabaseClient,
  ctx: TenantContext,
  _options: { deviceId: string }
): Promise<BootstrapResult> {
  const { data: tasks } = await listTasksForToday(supabase, ctx);
  const reports = await listReportsForBootstrap(supabase, ctx.tenantId, ctx.userId, 100);
  const uploadSessions = await listUploadSessionsForBootstrap(supabase, ctx.tenantId, ctx.userId, 100);
  const cursor = await getMaxCursor(supabase, ctx.tenantId);
  return {
    data: {
      tasks: (tasks ?? []) as unknown as BootstrapResult["data"]["tasks"],
      reports,
      uploadSessions,
    },
    cursor,
    serverTime: new Date().toISOString(),
  };
}
