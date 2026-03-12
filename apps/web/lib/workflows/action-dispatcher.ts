/**
 * Dispatches workflow actions. Implementations are stubs; real side effects
 * (notify, create task, alert, enqueue job) are wired by the host.
 */

import type { WorkflowAction, WorkflowContext } from "./workflow.types";

export type ActionHandler = (ctx: WorkflowContext, action: WorkflowAction) => Promise<void>;

const noop: ActionHandler = async () => {};

const handlers: Record<string, ActionHandler> = {
  notify_manager: noop,
  create_followup_task: noop,
  create_alert_record: noop,
  request_missing_evidence: noop,
  enqueue_copilot_summary: noop,
};

export function registerActionHandler(type: string, handler: ActionHandler): void {
  handlers[type] = handler;
}

export function getActionHandler(type: string): ActionHandler {
  return handlers[type] ?? noop;
}

export async function dispatchAction(ctx: WorkflowContext, action: WorkflowAction): Promise<void> {
  const handler = getActionHandler(action.type);
  await handler(ctx, action);
}

export async function dispatchActions(ctx: WorkflowContext, actions: WorkflowAction[]): Promise<void> {
  for (const action of actions) {
    await dispatchAction(ctx, action);
  }
}
