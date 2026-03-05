/**
 * Supabase Realtime subscriptions for tenant-scoped tables.
 * Use for Manager dashboard: live job status, report status, upload session status.
 * Tables must be enabled in Supabase Realtime publication.
 */

import type { RealtimeChannel } from "@supabase/supabase-js";
import type { SupabaseClient } from "@supabase/supabase-js";

export type TenantJobPayload = { id: string; status: string; type: string; tenant_id: string; updated_at: string };
export type TenantReportPayload = { id: string; status: string; tenant_id: string; submitted_at: string | null };
export type TenantUploadSessionPayload = { id: string; status: string; tenant_id: string };
export type TenantTaskAssignmentPayload = { task_id: string; user_id: string; tenant_id: string };

export interface TenantRealtimeCallbacks {
  onJob?: (payload: TenantJobPayload, event: "INSERT" | "UPDATE" | "DELETE") => void;
  onReport?: (payload: TenantReportPayload, event: "INSERT" | "UPDATE" | "DELETE") => void;
  onUploadSession?: (payload: TenantUploadSessionPayload, event: "INSERT" | "UPDATE" | "DELETE") => void;
  onTaskAssignment?: (payload: TenantTaskAssignmentPayload, event: "INSERT" | "UPDATE" | "DELETE") => void;
}

/**
 * Subscribe to tenant-scoped Postgres changes. Returns unsubscribe function.
 * Requires tables jobs, worker_reports, upload_sessions, task_assignments in Realtime publication.
 */
export function subscribeTenantRealtime(
  supabase: SupabaseClient,
  tenantId: string,
  callbacks: TenantRealtimeCallbacks
): () => void {
  const channelName = `tenant:${tenantId}`;
  const channel = supabase.channel(channelName);

  if (callbacks.onJob) {
    channel.on(
      "postgres_changes",
      { event: "*", schema: "public", table: "jobs", filter: `tenant_id=eq.${tenantId}` },
      (payload) => {
        const n = payload.new as Record<string, unknown>;
        const o = payload.old as Record<string, unknown>;
        const row = (n ?? o) as TenantJobPayload;
        if (row?.tenant_id === tenantId) callbacks.onJob?.(row, payload.eventType as "INSERT" | "UPDATE" | "DELETE");
      }
    );
  }
  if (callbacks.onReport) {
    channel.on(
      "postgres_changes",
      { event: "*", schema: "public", table: "worker_reports", filter: `tenant_id=eq.${tenantId}` },
      (payload) => {
        const n = payload.new as Record<string, unknown>;
        const o = payload.old as Record<string, unknown>;
        const row = (n ?? o) as TenantReportPayload;
        if (row?.tenant_id === tenantId) callbacks.onReport?.(row, payload.eventType as "INSERT" | "UPDATE" | "DELETE");
      }
    );
  }
  if (callbacks.onUploadSession) {
    channel.on(
      "postgres_changes",
      { event: "*", schema: "public", table: "upload_sessions", filter: `tenant_id=eq.${tenantId}` },
      (payload) => {
        const n = payload.new as Record<string, unknown>;
        const o = payload.old as Record<string, unknown>;
        const row = (n ?? o) as TenantUploadSessionPayload;
        if (row?.tenant_id === tenantId) callbacks.onUploadSession?.(row, payload.eventType as "INSERT" | "UPDATE" | "DELETE");
      }
    );
  }
  if (callbacks.onTaskAssignment) {
    channel.on(
      "postgres_changes",
      { event: "*", schema: "public", table: "task_assignments", filter: `tenant_id=eq.${tenantId}` },
      (payload) => {
        const n = payload.new as Record<string, unknown>;
        const o = payload.old as Record<string, unknown>;
        const row = (n ?? o) as TenantTaskAssignmentPayload;
        if (row?.tenant_id === tenantId) callbacks.onTaskAssignment?.(row, payload.eventType as "INSERT" | "UPDATE" | "DELETE");
      }
    );
  }

  channel.subscribe();
  return () => {
    supabase.removeChannel(channel as RealtimeChannel);
  };
}
