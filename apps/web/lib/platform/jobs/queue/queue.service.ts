import type { SupabaseClient } from "@supabase/supabase-js";
import { queueDb } from "./queue.db";
import type { IQueueAdapter } from "./queue.interface";

/** Current queue adapter (DB). Swap to queue.cloudflare if Queues binding is added. */
const adapter: IQueueAdapter = queueDb;

export function getQueueAdapter(): IQueueAdapter {
  return adapter;
}

export { queueDb };
export type { IQueueAdapter, EnqueueParams, JobRecord } from "./queue.interface";
