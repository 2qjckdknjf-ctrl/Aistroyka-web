/**
 * Generate openapi.json from @aistroyka/contracts Zod schemas.
 * Run: npm run build (or npx tsx build-openapi.ts)
 */
import { writeFileSync } from "fs";
import { zodToJsonSchema } from "zod-to-json-schema";
import {
  HealthResponseSchema,
  AnalyzeImageRequestSchema,
  AnalysisResultSchema,
  AnalyzeImageErrorSchema,
  ProjectSchema,
  ProjectsListResponseSchema,
  CreateProjectRequestSchema,
  CreateProjectResponseSchema,
  TenantMemberSchema,
  TenantMembersResponseSchema,
  SubscriptionTierSchema,
  TenantLimitsSchema,
  SyncBootstrapResponseSchema,
  SyncChangeEntrySchema,
  SyncChangesResponseSchema,
  SyncAckRequestSchema,
  SyncAckResponseSchema,
  ConfigPayloadSchema,
} from "@aistroyka/contracts";

const basePath = "/api/v1";

const components: Record<string, unknown> = {};

// Accept Zod 3 or Zod 4 schemas (contracts may use either depending on resolution).
// zod-to-json-schema supports both at runtime; its typings expect Zod 3, so we assert when calling.
function addSchema(name: string, schema: unknown): void {
  components[name] = zodToJsonSchema(schema as Parameters<typeof zodToJsonSchema>[0], {
    name,
    target: "openApi3",
  });
}

addSchema("HealthResponse", HealthResponseSchema);
addSchema("AnalyzeImageRequest", AnalyzeImageRequestSchema);
addSchema("AnalysisResult", AnalysisResultSchema);
addSchema("AnalyzeImageError", AnalyzeImageErrorSchema);
addSchema("Project", ProjectSchema);
addSchema("ProjectsListResponse", ProjectsListResponseSchema);
addSchema("CreateProjectRequest", CreateProjectRequestSchema);
addSchema("CreateProjectResponse", CreateProjectResponseSchema);
addSchema("TenantMember", TenantMemberSchema);
addSchema("TenantMembersResponse", TenantMembersResponseSchema);
addSchema("SubscriptionTier", SubscriptionTierSchema);
addSchema("TenantLimits", TenantLimitsSchema);
addSchema("SyncBootstrapResponse", SyncBootstrapResponseSchema);
addSchema("SyncChangeEntry", SyncChangeEntrySchema);
addSchema("SyncChangesResponse", SyncChangesResponseSchema);
addSchema("SyncAckRequest", SyncAckRequestSchema);
addSchema("SyncAckResponse", SyncAckResponseSchema);
addSchema("ConfigPayload", ConfigPayloadSchema);

const deviceIdParam = { name: "x-device-id", in: "header", required: true, schema: { type: "string" }, description: "Device identifier (required for sync and mobile writes)" };
const idempotencyKeyParam = { name: "x-idempotency-key", in: "header", required: false, schema: { type: "string" }, description: "Idempotency key for write requests (recommended for mobile)" };

const openapi = {
  openapi: "3.0.3",
  info: {
    title: "Aistroyka API",
    version: "1.0.0",
    description: "API v1 for Aistroyka Construction Intelligence. Auth: Bearer JWT + tenant context. Mobile: send x-device-id on sync and x-idempotency-key on all writes. Errors: 400/401/403/404/409/413/429 with JSON { error?: string }.",
  },
  servers: [{ url: "https://api.aistroyka.ai", description: "Production" }],
  paths: {
    [`${basePath}/health`]: {
      get: {
        summary: "Health check",
        tags: ["Health"],
        responses: {
          "200": {
            description: "Service health",
            content: { "application/json": { schema: { $ref: "#/components/schemas/HealthResponse" } } },
          },
        },
      },
    },
    [`${basePath}/config`]: {
      get: {
        summary: "Client config (flags, limits, serverTime, traceId, clientProfile)",
        tags: ["Config"],
        security: [{ bearerAuth: [] }],
        responses: {
          "200": {
            description: "Config payload",
            content: { "application/json": { schema: { $ref: "#/components/schemas/ConfigPayload" } } },
          },
          "401": { description: "Unauthorized (optional; unauthenticated returns flags off)" },
        },
      },
    },
    [`${basePath}/projects`]: {
      get: {
        summary: "List projects",
        tags: ["Projects"],
        security: [{ bearerAuth: [] }],
        responses: {
          "200": {
            description: "Projects list",
            content: { "application/json": { schema: { $ref: "#/components/schemas/ProjectsListResponse" } } },
          },
          "401": { description: "Unauthorized" },
          "403": { description: "Forbidden" },
        },
      },
      post: {
        summary: "Create project",
        tags: ["Projects"],
        security: [{ bearerAuth: [] }],
        requestBody: {
          content: { "application/json": { schema: { $ref: "#/components/schemas/CreateProjectRequest" } } },
        },
        responses: {
          "200": {
            description: "Created",
            content: { "application/json": { schema: { $ref: "#/components/schemas/CreateProjectResponse" } } },
          },
          "400": { description: "Bad request" },
          "401": { description: "Unauthorized" },
        },
      },
    },
    [`${basePath}/ai/analyze-image`]: {
      post: {
        summary: "Analyze construction image",
        tags: ["AI"],
        requestBody: {
          content: { "application/json": { schema: { $ref: "#/components/schemas/AnalyzeImageRequest" } } },
        },
        responses: {
          "200": {
            description: "Analysis result",
            content: { "application/json": { schema: { $ref: "#/components/schemas/AnalysisResult" } } },
          },
          "400": {
            content: { "application/json": { schema: { $ref: "#/components/schemas/AnalyzeImageError" } } },
          },
          "402": { description: "Quota exceeded" },
          "429": { description: "Rate limited" },
        },
      },
    },
    [`${basePath}/worker/tasks/today`]: {
      get: {
        summary: "List tasks for today (Worker Lite)",
        tags: ["Worker"],
        security: [{ bearerAuth: [] }],
        responses: {
          "200": { description: "Tasks list", content: { "application/json": { schema: { type: "object", properties: { data: { type: "array", items: { type: "object", properties: { id: { type: "string" }, title: { type: "string" }, status: { type: "string" } } } } } } } } },
          "401": { description: "Unauthorized" },
        },
      },
    },
    [`${basePath}/worker/sync`]: {
      get: {
        summary: "Sync delta (tasks, reports, upload sessions)",
        tags: ["Worker"],
        security: [{ bearerAuth: [] }],
        parameters: [{ name: "since", in: "query", schema: { type: "string", format: "date-time" }, description: "ISO timestamp" }],
        responses: { "200": { description: "Delta payload" }, "401": { description: "Unauthorized" } },
      },
    },
    [`${basePath}/sync/bootstrap`]: {
      get: {
        summary: "Initial sync snapshot + cursor",
        tags: ["Sync"],
        security: [{ bearerAuth: [] }],
        parameters: [deviceIdParam],
        responses: {
          "200": { description: "Snapshot and cursor", content: { "application/json": { schema: { $ref: "#/components/schemas/SyncBootstrapResponse" } } } },
          "400": { description: "Missing x-device-id" },
          "401": { description: "Unauthorized" },
        },
      },
    },
    [`${basePath}/sync/changes`]: {
      get: {
        summary: "Delta changes after cursor",
        tags: ["Sync"],
        security: [{ bearerAuth: [] }],
        parameters: [
          deviceIdParam,
          { name: "cursor", in: "query", required: true, schema: { type: "integer", format: "int64" }, description: "Cursor from bootstrap or previous changes" },
          { name: "limit", in: "query", schema: { type: "integer", default: 100 } },
        ],
        responses: {
          "200": { description: "Changes and nextCursor", content: { "application/json": { schema: { $ref: "#/components/schemas/SyncChangesResponse" } } } },
          "400": { description: "Missing cursor or x-device-id" },
          "401": { description: "Unauthorized" },
        },
      },
    },
    [`${basePath}/sync/ack`]: {
      post: {
        summary: "Acknowledge device cursor",
        tags: ["Sync"],
        security: [{ bearerAuth: [] }],
        parameters: [deviceIdParam, idempotencyKeyParam],
        requestBody: { content: { "application/json": { schema: { $ref: "#/components/schemas/SyncAckRequest" } } } },
        responses: {
          "200": { description: "Ack ok", content: { "application/json": { schema: { $ref: "#/components/schemas/SyncAckResponse" } } } },
          "400": { description: "Missing x-device-id or invalid body" },
          "401": { description: "Unauthorized" },
        },
      },
    },
    [`${basePath}/media/upload-sessions`]: {
      post: {
        summary: "Create upload session",
        tags: ["Media"],
        security: [{ bearerAuth: [] }],
        requestBody: { content: { "application/json": { schema: { type: "object", properties: { purpose: { type: "string", enum: ["report_before", "report_after", "project_media"] } } } } } },
        responses: { "200": { description: "Session with upload_path" }, "401": { description: "Unauthorized" } },
      },
    },
    [`${basePath}/admin/metrics/overview`]: {
      get: {
        summary: "Tenant metrics overview (admin)",
        tags: ["Admin"],
        security: [{ bearerAuth: [] }],
        parameters: [{ name: "range", in: "query", schema: { type: "string", enum: ["7d", "30d", "90d"] } }],
        responses: { "200": { description: "Metrics rows" }, "401": { description: "Unauthorized" }, "403": { description: "Forbidden" } },
      },
    },
    [`${basePath}/admin/audit-logs`]: {
      get: {
        summary: "Audit logs (admin)",
        tags: ["Admin"],
        security: [{ bearerAuth: [] }],
        parameters: [{ name: "range", in: "query", schema: { type: "string", enum: ["7d", "30d", "90d"] } }],
        responses: { "200": { description: "Audit log entries" }, "403": { description: "Forbidden" } },
      },
    },
    [`${basePath}/admin/exports`]: {
      post: {
        summary: "Start export job",
        tags: ["Admin"],
        security: [{ bearerAuth: [] }],
        requestBody: {
          content: {
            "application/json": {
              schema: {
                type: "object",
                properties: { export_type: { type: "string", enum: ["reports", "ai_usage", "audit_logs"] }, range_days: { type: "integer" } },
              },
            },
          },
        },
        responses: { "200": { description: "job_id, status" }, "403": { description: "Forbidden" } },
      },
    },
    [`${basePath}/admin/exports/{id}/status`]: {
      get: {
        summary: "Export job status",
        tags: ["Admin"],
        security: [{ bearerAuth: [] }],
        parameters: [{ name: "id", in: "path", required: true, schema: { type: "string", format: "uuid" } }],
        responses: { "200": { description: "job_id, status, created_at, updated_at" }, "404": { description: "Not found" } },
      },
    },
    [`${basePath}/org/tenants`]: {
      get: {
        summary: "List tenants in organization (org admin)",
        tags: ["Org"],
        security: [{ bearerAuth: [] }],
        description: "Requires x-organization-id header. org_owner or org_admin.",
        responses: { "200": { description: "tenant_ids" }, "400": { description: "Missing x-organization-id" }, "403": { description: "Forbidden" } },
      },
    },
    [`${basePath}/org/metrics/overview`]: {
      get: {
        summary: "Org-wide metrics (org admin)",
        tags: ["Org"],
        security: [{ bearerAuth: [] }],
        parameters: [{ name: "range", in: "query", schema: { type: "string", enum: ["7d", "30d", "90d"] } }],
        responses: { "200": { description: "Metrics for linked tenants" }, "403": { description: "Forbidden" } },
      },
    },
  },
  components: {
    schemas: components,
    securitySchemes: {
      bearerAuth: { type: "http", scheme: "bearer", bearerFormat: "JWT" },
    },
  },
  security: [{ bearerAuth: [] }],
};

const outDir = "dist";
const outPath = `${outDir}/openapi.json`;
writeFileSync(outPath, JSON.stringify(openapi, null, 2), "utf-8");
console.log(`Wrote ${outPath}`);
process.exit(0);
