/**
 * Integration layer — adapter pattern, tenant-safe, error boundaries.
 */

export type {
  IntegrationType,
  IntegrationStatus,
  IntegrationContext,
  IntegrationResult,
  IIntegrationAdapter,
  IErpAdapter,
  IDocumentAdapter,
  IStorageAdapter,
  IBimAdapter,
  IWebhookOutboundAdapter,
} from "./integration.types";
export { IntegrationError } from "./integration.types";
export { BaseAdapter, type BaseAdapterConfig } from "./base-adapter";
export { ErpAdapter, type ErpAdapterConfig } from "./erp-adapter";
export { DocumentAdapter, type DocumentAdapterConfig } from "./document-adapter";
export { StorageAdapter, type StorageAdapterConfig } from "./storage-adapter";
export { BimAdapter, type BimAdapterConfig } from "./bim-adapter";
export { WebhookAdapter, type WebhookAdapterConfig } from "./webhook-adapter";
export {
  registerAdapter,
  getAdapter,
  setAdapterEnabled,
  isAdapterRegistered,
  getAvailableAdapter,
  listRegisteredTypes,
} from "./integration-registry";
