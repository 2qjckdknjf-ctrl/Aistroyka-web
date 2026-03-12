/**
 * ERP integration adapter — scaffold.
 * No real ERP implemented; contract and error boundary only.
 */

import { BaseAdapter } from "./base-adapter";
import type { IntegrationContext, IntegrationResult } from "./integration.types";
import type { BaseAdapterConfig } from "./base-adapter";

export interface ErpAdapterConfig extends BaseAdapterConfig {
  type: "erp";
  /** Future: endpoint URL, API key ref */
  endpoint?: string | null;
}

export class ErpAdapter extends BaseAdapter<ErpAdapterConfig> {
  readonly type = "erp" as const;

  protected async checkAvailable(ctx: IntegrationContext): Promise<boolean> {
    return Boolean(this.config.endpoint && ctx.tenantId);
  }

  protected async doHealthCheck(_ctx: IntegrationContext): Promise<IntegrationResult<{ status: string }>> {
    // Scaffold: no real call
    return { ok: true, data: { status: "scaffold" } };
  }
}
