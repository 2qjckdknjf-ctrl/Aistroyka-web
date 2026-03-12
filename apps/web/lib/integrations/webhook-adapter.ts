/**
 * Webhook outbound adapter — scaffold.
 * Deliver events to tenant-configured endpoints; no real delivery yet.
 */

import { BaseAdapter } from "./base-adapter";
import type { IntegrationContext, IntegrationResult } from "./integration.types";
import type { BaseAdapterConfig } from "./base-adapter";

export interface WebhookAdapterConfig extends BaseAdapterConfig {
  type: "webhook";
  /** Future: max endpoints per tenant */
  maxEndpoints?: number;
}

export class WebhookAdapter extends BaseAdapter<WebhookAdapterConfig> {
  readonly type = "webhook" as const;

  protected async checkAvailable(ctx: IntegrationContext): Promise<boolean> {
    return Boolean(ctx.tenantId);
  }

  protected async doHealthCheck(_ctx: IntegrationContext): Promise<IntegrationResult<{ status: string }>> {
    return { ok: true, data: { status: "scaffold" } };
  }
}
