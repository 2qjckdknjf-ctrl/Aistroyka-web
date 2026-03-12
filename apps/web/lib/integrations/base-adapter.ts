/**
 * Base adapter with error boundary and tenant context.
 * All adapters extend this for consistent behavior.
 */

import type { IntegrationContext, IntegrationResult, IntegrationType } from "./integration.types";
import { IntegrationError } from "./integration.types";

export interface BaseAdapterConfig {
  type: IntegrationType;
  enabled: boolean;
}

export abstract class BaseAdapter<TConfig extends BaseAdapterConfig = BaseAdapterConfig>
  implements Pick<import("./integration.types").IIntegrationAdapter, "type" | "isAvailable" | "healthCheck">
{
  abstract readonly type: IntegrationType;
  protected config: TConfig;

  constructor(config: TConfig) {
    this.config = config;
  }

  async isAvailable(ctx: IntegrationContext): Promise<boolean> {
    if (!this.config.enabled) return false;
    try {
      return await this.checkAvailable(ctx);
    } catch {
      return false;
    }
  }

  /** Override for adapter-specific availability (e.g. config present). */
  protected async checkAvailable(_ctx: IntegrationContext): Promise<boolean> {
    return true;
  }

  async healthCheck(ctx: IntegrationContext): Promise<IntegrationResult<{ status: string }>> {
    try {
      if (!this.config.enabled) {
        return { ok: true, data: { status: "disabled" } };
      }
      const result = await this.doHealthCheck(ctx);
      return result;
    } catch (e) {
      const err = e instanceof IntegrationError ? e : new IntegrationError(
        e instanceof Error ? e.message : String(e),
        this.type,
        true,
        e
      );
      return {
        ok: false,
        error: err.message,
        retryable: err.retryable,
      };
    }
  }

  /** Override for adapter-specific health. */
  protected abstract doHealthCheck(ctx: IntegrationContext): Promise<IntegrationResult<{ status: string }>>;

  /** Wrap a call in error boundary; throws IntegrationError with retryable flag. */
  protected async withErrorBoundary<R>(
    fn: () => Promise<R>,
    retryable: boolean = true
  ): Promise<R> {
    try {
      return await fn();
    } catch (e) {
      if (e instanceof IntegrationError) throw e;
      throw new IntegrationError(
        e instanceof Error ? e.message : String(e),
        this.type,
        retryable,
        e
      );
    }
  }
}
