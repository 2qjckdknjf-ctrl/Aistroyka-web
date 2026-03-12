/**
 * Storage integration adapter — scaffold.
 * External blob/object storage; no real implementation.
 */

import { BaseAdapter } from "./base-adapter";
import type { IntegrationContext, IntegrationResult } from "./integration.types";
import type { BaseAdapterConfig } from "./base-adapter";

export interface StorageAdapterConfig extends BaseAdapterConfig {
  type: "storage";
  /** Future: bucket/container name, credentials ref */
  bucket?: string | null;
}

export class StorageAdapter extends BaseAdapter<StorageAdapterConfig> {
  readonly type = "storage" as const;

  protected async checkAvailable(ctx: IntegrationContext): Promise<boolean> {
    return Boolean(this.config.bucket && ctx.tenantId);
  }

  protected async doHealthCheck(_ctx: IntegrationContext): Promise<IntegrationResult<{ status: string }>> {
    return { ok: true, data: { status: "scaffold" } };
  }
}
