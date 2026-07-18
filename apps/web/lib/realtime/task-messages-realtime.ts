/**
 * Supabase Realtime subscription for task-scoped chat messages.
 * Requires public.task_messages in supabase_realtime publication.
 */

import type { RealtimeChannel, SupabaseClient } from "@supabase/supabase-js";

export type TaskMessageRealtimeRow = {
  id: string;
  tenant_id: string;
  project_id: string;
  task_id: string;
  sender_user_id: string;
  kind: string;
  body: string | null;
  upload_session_id: string | null;
  duration_ms: number | null;
  client_id: string | null;
  created_at: string;
  deleted_at: string | null;
};

export type TaskMessageRealtimeCallbacks = {
  onInsert?: (row: TaskMessageRealtimeRow) => void;
  onUpdate?: (row: TaskMessageRealtimeRow) => void;
};

/**
 * Subscribe to postgres_changes on task_messages for a single task.
 * Returns unsubscribe function.
 */
export function subscribeTaskMessages(
  supabase: SupabaseClient,
  taskId: string,
  callbacks: TaskMessageRealtimeCallbacks
): () => void {
  const channelName = `task_messages:${taskId}`;
  const channel: RealtimeChannel = supabase.channel(channelName);

  if (callbacks.onInsert) {
    channel.on(
      "postgres_changes",
      {
        event: "INSERT",
        schema: "public",
        table: "task_messages",
        filter: `task_id=eq.${taskId}`,
      },
      (payload) => {
        const row = payload.new as TaskMessageRealtimeRow;
        if (row?.task_id === taskId && !row.deleted_at) callbacks.onInsert?.(row);
      }
    );
  }

  if (callbacks.onUpdate) {
    channel.on(
      "postgres_changes",
      {
        event: "UPDATE",
        schema: "public",
        table: "task_messages",
        filter: `task_id=eq.${taskId}`,
      },
      (payload) => {
        const row = payload.new as TaskMessageRealtimeRow;
        if (row?.task_id === taskId) callbacks.onUpdate?.(row);
      }
    );
  }

  channel.subscribe();
  return () => {
    void supabase.removeChannel(channel);
  };
}
