# Integration Layer Foundation

## Overview

The integration layer provides an **adapter pattern** for external systems (ERP, document, storage, BIM, webhook outbound). All adapters are **tenant-safe** (receive `IntegrationContext` with `tenantId`), use a **error boundary** (IntegrationError, retryable flag), and are registered in a single **registry** with enable/disable.

## Structure

| File | Role |
|------|------|
| `integration.types.ts` | `IntegrationType`, `IntegrationContext`, `IntegrationResult`, adapter interfaces, `IntegrationError` |
| `base-adapter.ts` | Abstract `BaseAdapter` with `isAvailable`, `healthCheck`, `withErrorBoundary` |
| `erp-adapter.ts` | ERP scaffold (config: endpoint) |
| `document-adapter.ts` | Document scaffold (config: provider) |
| `storage-adapter.ts` | Storage scaffold (config: bucket) |
| `bim-adapter.ts` | BIM scaffold (config: platform) |
| `webhook-adapter.ts` | Webhook outbound scaffold |
| `integration-registry.ts` | `registerAdapter`, `getAdapter`, `setAdapterEnabled`, `getAvailableAdapter`, `listRegisteredTypes` |

## Contracts

- **IIntegrationAdapter**: `type`, `isAvailable(ctx)`, `healthCheck(ctx)`.
- **IntegrationContext**: `tenantId`, optional `projectId`, `actorId`.
- **IntegrationResult&lt;T&gt;**: `ok`, `data?`, `error?`, `retryable?`.
- **Retry**: Caller’s responsibility; `IntegrationError.retryable` and `IntegrationResult.retryable` indicate transient vs permanent.

## What is real vs scaffold

- **Real:** Types, base adapter with error boundary, registry (register/get/enable/disable), tenant context on every call.
- **Scaffold:** No real ERP/document/storage/BIM/webhook implementations; adapters return `status: "scaffold"` from health check. No credentials or outbound calls.

## Extension points

1. **Register adapters:** At startup, `registerAdapter("erp", () => new ErpAdapter({ type: "erp", enabled: true, endpoint: "…" }))`.
2. **Implement real logic:** Override `doHealthCheck` and add methods (e.g. `syncCostCodes`) in each adapter; call `withErrorBoundary` for operations that can throw.
3. **Retry strategy:** Callers should check `result.retryable` and implement backoff; no built-in retry in the layer.
4. **Config per tenant:** Registry is global; tenant-specific config (e.g. endpoint per tenant) can live in DB and be passed when creating the adapter or via context.
