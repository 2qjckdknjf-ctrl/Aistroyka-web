import { NextResponse } from "next/server";
import { createClientFromRequest } from "@/lib/supabase/server";
import { getTenantContextFromRequest, requireTenant, TenantRequiredError } from "@/lib/tenant";
import { canReviewReport } from "@/lib/domain/reports/report.policy";
import { isLiteWorkerClient } from "@/lib/tenant/client-profile";
import { getProject } from "@/lib/domain/projects/project.service";
import { generateReportsExportCsv } from "@/lib/domain/reports/report-export.service";
import type { TenantContext } from "@/lib/tenant/tenant.types";

export const dynamic = "force-dynamic";

const CSV_CONTENT_TYPE = "text/csv; charset=utf-8";
const CSV_FILENAME = "reports-export.csv";
const ALLOWED_STATUSES = new Set(["draft", "submitted", "approved", "rejected", "changes_requested"]);

/** GET /api/v1/reports/export — read-only manager/admin CSV export with safe columns only. */
export async function GET(request: Request) {
  const ctx = await getTenantContextFromRequest(request);
  try {
    requireTenant(ctx);
  } catch (e) {
    if (e instanceof TenantRequiredError) {
      return NextResponse.json({ error: e.message }, { status: e.message.includes("membership") ? 403 : 401 });
    }
    throw e;
  }

  if (!isReportExportAdmin(ctx) || isLiteWorkerClient(ctx) || !canReviewReport(ctx)) {
    return NextResponse.json({ error: "Insufficient rights" }, { status: 403 });
  }

  const url = new URL(request.url);
  const projectId = normalizeParam(url.searchParams.get("project_id"));
  const parsedQuery = parseExportQuery(url.searchParams);
  if (!parsedQuery.ok) {
    return NextResponse.json({ error: parsedQuery.error }, { status: 400 });
  }
  const supabase = await createClientFromRequest(request);

  if (projectId) {
    const { data: project, error } = await getProject(supabase, ctx, projectId);
    if (error === "Insufficient rights") {
      return NextResponse.json({ error }, { status: 403 });
    }
    if (!project) {
      return NextResponse.json({ error: error ?? "Not found" }, { status: 404 });
    }
  }

  const csv = await generateReportsExportCsv(supabase, ctx.tenantId, {
    projectId,
    status: parsedQuery.status,
    from: parsedQuery.from,
    to: parsedQuery.to,
    rangeDays: parsedQuery.rangeDays,
  });

  return new NextResponse(csv, {
    status: 200,
    headers: {
      "Content-Type": CSV_CONTENT_TYPE,
      "Content-Disposition": `attachment; filename="${CSV_FILENAME}"`,
      "Cache-Control": "private, no-store",
    },
  });
}

function normalizeParam(value: string | null): string | undefined {
  const trimmed = value?.trim();
  return trimmed || undefined;
}

function isReportExportAdmin(ctx: unknown): ctx is TenantContext {
  if (!ctx || typeof ctx !== "object") return false;
  const candidate = ctx as Partial<TenantContext>;
  return Boolean(candidate.tenantId && candidate.userId && (candidate.role === "owner" || candidate.role === "admin"));
}

type ParsedExportQuery =
  | { ok: true; status?: string; from?: string; to?: string; rangeDays?: number }
  | { ok: false; error: string };

function parseExportQuery(searchParams: URLSearchParams): ParsedExportQuery {
  const status = normalizeParam(searchParams.get("status"));
  if (status && !ALLOWED_STATUSES.has(status)) {
    return { ok: false, error: "Invalid status filter" };
  }
  const from = normalizeParam(searchParams.get("from"));
  if (from && !isValidDateFilter(from)) {
    return { ok: false, error: "Invalid from date" };
  }
  const to = normalizeParam(searchParams.get("to"));
  if (to && !isValidDateFilter(to)) {
    return { ok: false, error: "Invalid to date" };
  }
  const rangeDaysResult = parseRangeDays(searchParams.get("range_days"));
  if (!rangeDaysResult.ok) {
    return rangeDaysResult;
  }
  return { ok: true, status, from, to, rangeDays: rangeDaysResult.rangeDays };
}

function isValidDateFilter(value: string): boolean {
  return Number.isFinite(Date.parse(value));
}

function parseRangeDays(value: string | null): { ok: true; rangeDays?: number } | { ok: false; error: string } {
  const normalized = normalizeParam(value);
  if (!normalized) return { ok: true };
  if (!/^\d+$/.test(normalized)) return { ok: false, error: "Invalid range_days" };
  const parsed = Number.parseInt(normalized, 10);
  if (!Number.isFinite(parsed)) return { ok: false, error: "Invalid range_days" };
  return { ok: true, rangeDays: Math.min(Math.max(parsed, 1), 365) };
}
