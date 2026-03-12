/**
 * BIM integration adapter — scaffold.
 * Model sync, clash, quantities; no real implementation.
 */

import { BaseAdapter } from "./base-adapter";
import type { IntegrationContext, IntegrationResult } from "./integration.types";
import type { BaseAdapterConfig } from "./base-adapter";

export interface BimAdapterConfig extends BaseAdapterConfig {
  type: "bim";
  /** Future: platform (e.g. autodesk, bim360) */
  platform?: string | null;
}

export class BimAdapter extends BaseAdapter<BimAdapterConfig> {
  readonly type = "bim" as const;

  protected async checkAvailable(ctx: IntegrationContext): Promise<boolean> {
    return Boolean(ctx.tenantId);
  }

  protected async doHealthCheck(_ctx: IntegrationContext): Promise<IntegrationResult<{ status: string }>> {
    return { ok: true, data: { status: "scaffold" } };
  }
}
