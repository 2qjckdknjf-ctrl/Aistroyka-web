/**
 * Document integration adapter — scaffold.
 * Drawings, specs; no real implementation.
 */

import { BaseAdapter } from "./base-adapter";
import type { IntegrationContext, IntegrationResult } from "./integration.types";
import type { BaseAdapterConfig } from "./base-adapter";

export interface DocumentAdapterConfig extends BaseAdapterConfig {
  type: "document";
  /** Future: provider (e.g. procore, autodesk) */
  provider?: string | null;
}

export class DocumentAdapter extends BaseAdapter<DocumentAdapterConfig> {
  readonly type = "document" as const;

  protected async checkAvailable(ctx: IntegrationContext): Promise<boolean> {
    return Boolean(ctx.tenantId);
  }

  protected async doHealthCheck(_ctx: IntegrationContext): Promise<IntegrationResult<{ status: string }>> {
    return { ok: true, data: { status: "scaffold" } };
  }
}
