/**
 * Integration registry: register adapters, get by type, enable/disable.
 * Tenant-agnostic; tenant filtering is done by adapters via IntegrationContext.
 */

import type { IntegrationType, IIntegrationAdapter, IntegrationContext } from "./integration.types";

type AdapterFactory = () => IIntegrationAdapter;

const registry = new Map<IntegrationType, { factory: AdapterFactory; enabled: boolean }>();

export function registerAdapter(
  type: IntegrationType,
  factory: AdapterFactory,
  options?: { enabled?: boolean }
): void {
  registry.set(type, {
    factory,
    enabled: options?.enabled ?? true,
  });
}

export function getAdapter(type: IntegrationType): IIntegrationAdapter | null {
  const entry = registry.get(type);
  if (!entry || !entry.enabled) return null;
  return entry.factory();
}

export function setAdapterEnabled(type: IntegrationType, enabled: boolean): void {
  const entry = registry.get(type);
  if (entry) entry.enabled = enabled;
}

export function isAdapterRegistered(type: IntegrationType): boolean {
  return registry.has(type);
}

/** Returns adapter if registered, enabled, and available for context. */
export async function getAvailableAdapter(
  type: IntegrationType,
  ctx: IntegrationContext
): Promise<IIntegrationAdapter | null> {
  const adapter = getAdapter(type);
  if (!adapter) return null;
  const available = await adapter.isAvailable(ctx);
  return available ? adapter : null;
}

export function listRegisteredTypes(): IntegrationType[] {
  return Array.from(registry.entries())
    .filter(([, v]) => v.enabled)
    .map(([t]) => t);
}
