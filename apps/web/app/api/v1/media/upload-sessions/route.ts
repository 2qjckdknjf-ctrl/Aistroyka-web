import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getTenantContextFromRequest, requireTenant, TenantRequiredError } from "@/lib/tenant";
import { createUploadSession } from "@/lib/domain/upload-session/upload-session.service";
import { checkRequestBodySize } from "@/lib/api/request-limit";

export const dynamic = "force-dynamic";

const PURPOSES = ["report_before", "report_after", "project_media"] as const;

export async function POST(request: Request) {
  const sizeError = checkRequestBodySize(request);
  if (sizeError) return NextResponse.json({ error: sizeError }, { status: 413 });
  const ctx = await getTenantContextFromRequest(request);
  try {
    requireTenant(ctx);
  } catch (e) {
    if (e instanceof TenantRequiredError) {
      return NextResponse.json({ error: e.message }, { status: e.message.includes("membership") ? 403 : 401 });
    }
    throw e;
  }
  let body: { purpose?: string } = {};
  try {
    body = await request.json().catch(() => ({}));
  } catch {
    /* empty ok */
  }
  const purpose = typeof body.purpose === "string" && PURPOSES.includes(body.purpose as typeof PURPOSES[number])
    ? (body.purpose as typeof PURPOSES[number])
    : "project_media";
  const supabase = await createClient();
  const { data, error } = await createUploadSession(supabase, ctx, purpose);
  if (error) return NextResponse.json({ error }, { status: 403 });
  return NextResponse.json({ data });
}
