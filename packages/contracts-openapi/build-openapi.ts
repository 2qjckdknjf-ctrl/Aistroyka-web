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
} from "@aistroyka/contracts";

const basePath = "/api/v1";

const components: Record<string, unknown> = {};

function addSchema(name: string, schema: import("zod").ZodTypeAny): void {
  components[name] = zodToJsonSchema(schema, { name, target: "openApi3" });
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

const openapi = {
  openapi: "3.0.3",
  info: {
    title: "Aistroyka API",
    version: "1.0.0",
    description: "API v1 for Aistroyka Construction Intelligence. Auth: Bearer JWT + tenant context.",
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
