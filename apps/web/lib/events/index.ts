/**
 * Domain events and alerts foundation.
 * Persistence can be added via audit_logs or dedicated tables.
 */

export type { DomainEventType, DomainEvent, AlertRecord } from "./event.types";
export {
  publishDomainEvent,
  subscribeDomainEvents,
  createDomainEvent,
  type DomainEventSubscriber,
} from "./domain-events";
