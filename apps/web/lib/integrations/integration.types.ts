/**
 * Integration layer — types and contracts.
 * Tenant-safe; all adapters receive tenantId for isolation.
 */

export type IntegrationType =
  | "erp"
  | "document"
  | "storage"
  | "bim"
  | "webhook";

export type IntegrationStatus = "enabled" | "disabled" | "error";

export interface IntegrationContext {
  tenantId: string;
  projectId?: string | null;
  /** Optional user/scoped id for audit */
  actorId?: string | null;
}

export interface IntegrationResult<T = unknown> {
  ok: boolean;
  data?: T;
  error?: string;
  /** For retry: transient vs permanent */
  retryable?: boolean;
}

/** Base contract for all adapters. Implementations are tenant-scoped. */
export interface IIntegrationAdapter {
  readonly type: IntegrationType;
  /** Check if adapter is available (config present, not disabled). */
  isAvailable(ctx: IntegrationContext): Promise<boolean>;
  /** Health check for this integration. */
  healthCheck(ctx: IntegrationContext): Promise<IntegrationResult<{ status: string }>>;
}

/** ERP: sync orders, cost codes, resources. Scaffold only. */
export interface IErpAdapter extends IIntegrationAdapter {
  type: "erp";
  // Future: syncCostCodes(ctx, projectId), pushReport(ctx, payload)…
}

/** Document: pull/push drawings, specs. Scaffold only. */
export interface IDocumentAdapter extends IIntegrationAdapter {
  type: "document";
  // Future: listDocuments(ctx, projectId), getDocument(ctx, id)…
}

/** Storage: external blob/object storage. Scaffold only. */
export interface IStorageAdapter extends IIntegrationAdapter {
  type: "storage";
  // Future: upload(ctx, key, stream), getSignedUrl(ctx, key)…
}

/** BIM: model sync, clash, quantities. Scaffold only. */
export interface IBimAdapter extends IIntegrationAdapter {
  type: "bim";
  // Future: getModelInfo(ctx, projectId), syncClash(ctx, payload)…
}

/** Webhook: outbound delivery. Scaffold only. */
export interface IWebhookOutboundAdapter extends IIntegrationAdapter {
  type: "webhook";
  // Future: deliver(ctx, url, payload, signature)…
}

/** Error boundary: wrap adapter calls; retry strategy is caller's responsibility. */
export class IntegrationError extends Error {
  constructor(
    message: string,
    public readonly adapterType: IntegrationType,
    public readonly retryable: boolean = false,
    public readonly cause?: unknown
  ) {
    super(message);
    this.name = "IntegrationError";
  }
}
