/**
 * Lightweight domain event publishing (foundation).
 * In-memory subscribers; persistence can be added via audit or dedicated store.
 */

import type { DomainEvent } from "./event.types";

export type DomainEventSubscriber = (event: DomainEvent) => void | Promise<void>;

const subscribers: DomainEventSubscriber[] = [];

export function subscribeDomainEvents(fn: DomainEventSubscriber): () => void {
  subscribers.push(fn);
  return () => {
    const i = subscribers.indexOf(fn);
    if (i >= 0) subscribers.splice(i, 1);
  };
}

/** Publish domain event to all subscribers. Best-effort; does not throw. */
export async function publishDomainEvent(event: DomainEvent): Promise<void> {
  for (const fn of subscribers) {
    try {
      await Promise.resolve(fn(event));
    } catch {
      // Continue to other subscribers
    }
  }
}

function generateEventId(): string {
  return `evt-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 9)}`;
}

/** Create a domain event with generated id and timestamp. */
export function createDomainEvent(
  type: DomainEvent["type"],
  tenantId: string,
  source: DomainEvent["source"],
  payload: Record<string, unknown>,
  projectId?: string
): DomainEvent {
  return {
    id: generateEventId(),
    type,
    tenantId,
    projectId,
    at: new Date().toISOString(),
    source,
    payload,
  };
}
