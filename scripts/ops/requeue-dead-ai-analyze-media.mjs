#!/usr/bin/env node
/**
 * Safe recovery for dead ai_analyze_media jobs.
 *
 * Dry-run by default (no writes). Requires explicit --execute to requeue.
 *
 * Usage:
 *   node scripts/ops/requeue-dead-ai-analyze-media.mjs --tenant-id=<uuid>
 *   node scripts/ops/requeue-dead-ai-analyze-media.mjs --tenant-id=<uuid> --execute
 *   node scripts/ops/requeue-dead-ai-analyze-media.mjs --tenant-id=<uuid> --limit=50
 *
 * Env (from apps/web/.env.local or process env):
 *   NEXT_PUBLIC_SUPABASE_URL
 *   SUPABASE_SERVICE_ROLE_KEY
 *
 * Does NOT run against production unless you point env at production.
 * Does NOT delete jobs. Does NOT touch other tenants without --tenant-id.
 * Does NOT requeue security-rejected (cross-tenant poisoned) media paths.
 */

import { createClient } from "@supabase/supabase-js";
import { readFileSync, existsSync } from "node:fs";
import { resolve } from "node:path";
import { fileURLToPath } from "node:url";
import {
  MEDIA_BUCKET,
  assertMediaPathTenantScope,
  classifyMediaFileUrlForTenant,
  isUuid,
} from "./lib/media-path-tenant-guard.mjs";

function loadEnvFile(path) {
  if (!existsSync(path)) return;
  const raw = readFileSync(path, "utf8");
  for (const line of raw.split("\n")) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eq = trimmed.indexOf("=");
    if (eq <= 0) continue;
    const key = trimmed.slice(0, eq).trim();
    let val = trimmed.slice(eq + 1).trim();
    if (
      (val.startsWith('"') && val.endsWith('"')) ||
      (val.startsWith("'") && val.endsWith("'"))
    ) {
      val = val.slice(1, -1);
    }
    if (!(key in process.env)) process.env[key] = val;
  }
}

loadEnvFile(resolve(process.cwd(), ".env.local"));
loadEnvFile(resolve(process.cwd(), "apps/web/.env.local"));

function argValue(name) {
  const prefix = `--${name}=`;
  const hit = process.argv.find((a) => a.startsWith(prefix));
  return hit ? hit.slice(prefix.length) : null;
}

function hasFlag(name) {
  return process.argv.includes(`--${name}`);
}

/**
 * Classify whether a dead job's media reference is recoverable.
 * Never returns foreign object paths for logging.
 */
export function classifyJobMediaReference({
  media,
  session,
  tenantId,
  supabaseUrl,
  projectId = null,
}) {
  if (media) {
    if (media.tenant_id && media.tenant_id !== tenantId) {
      return {
        resolvable: false,
        reason: "media_tenant_mismatch",
        permanently_unrecoverable: true,
        security_rejected: true,
      };
    }
    const fileUrl = typeof media.file_url === "string" ? media.file_url : "";
    if (fileUrl.trim()) {
      const allowedProject = projectId || media.project_id || null;
      const classified = classifyMediaFileUrlForTenant(
        fileUrl,
        tenantId,
        allowedProject,
        supabaseUrl
      );
      if (classified.security_rejected) {
        return {
          resolvable: false,
          reason: classified.reason,
          permanently_unrecoverable: true,
          security_rejected: true,
        };
      }
      if (classified.resolvable) {
        return {
          resolvable: true,
          reason: classified.reason,
          bucketRelativePath: classified.bucketRelativePath,
          security_rejected: false,
        };
      }
      // Non-security unresolvable file_url — fall through to session if present
      if (!session) {
        return {
          resolvable: false,
          reason: classified.reason,
          permanently_unrecoverable: true,
          security_rejected: false,
        };
      }
    }
  }

  if (!session) {
    return {
      resolvable: false,
      reason: "upload_session_missing",
      permanently_unrecoverable: true,
      security_rejected: false,
    };
  }
  if (session.tenant_id && session.tenant_id !== tenantId) {
    return {
      resolvable: false,
      reason: "session_tenant_mismatch",
      permanently_unrecoverable: true,
      security_rejected: true,
    };
  }
  if (session.status === "created" || session.status === "uploaded") {
    return {
      resolvable: false,
      reason: "upload_not_finalized",
      permanently_unrecoverable: false,
      security_rejected: false,
    };
  }
  if (session.status !== "finalized" || !session.object_path) {
    return {
      resolvable: false,
      reason: "corrupt_or_missing_path",
      permanently_unrecoverable: true,
      security_rejected: false,
    };
  }

  const scope = assertMediaPathTenantScope(session.object_path, tenantId, null);
  if (!scope.ok) {
    return {
      resolvable: false,
      reason: "poisoned_cross_tenant_path",
      permanently_unrecoverable: true,
      security_rejected: true,
    };
  }
  // Session path must also sit under tenant/session id when session id known
  if (session.id) {
    const expected = `${tenantId}/${session.id}`;
    if (
      scope.bucketRelativePath !== expected &&
      !scope.bucketRelativePath.startsWith(`${expected}/`)
    ) {
      return {
        resolvable: false,
        reason: "session_path_mismatch",
        permanently_unrecoverable: true,
        security_rejected: true,
      };
    }
  }

  return {
    resolvable: true,
    reason: "upload_session_path",
    bucketRelativePath: scope.bucketRelativePath,
    security_rejected: false,
  };
}

async function storageExists(admin, bucketRelativePath) {
  const relative = bucketRelativePath;
  const hasSlash = relative.includes("/");
  const folderPath = hasSlash ? relative.split("/").slice(0, -1).join("/") : "";
  const segmentName = hasSlash ? relative.split("/").pop() : relative;
  const { data, error } = await admin.storage.from(MEDIA_BUCKET).list(folderPath, { limit: 1000 });
  if (error) return { ok: false, temporary: true };
  const items = data ?? [];
  return { ok: items.some((item) => item.name === segmentName), temporary: false };
}

async function main() {
  const tenantId = argValue("tenant-id");
  const execute = hasFlag("execute");
  const limit = Math.min(parseInt(argValue("limit") ?? "100", 10) || 100, 500);

  if (!tenantId || !isUuid(tenantId)) {
    console.error("ERROR: --tenant-id=<uuid> is required (never scopes all tenants by default).");
    process.exit(2);
  }

  const url = (process.env.NEXT_PUBLIC_SUPABASE_URL ?? "").trim();
  const key = (process.env.SUPABASE_SERVICE_ROLE_KEY ?? "").trim();
  if (!url || !key) {
    console.error("ERROR: NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY required.");
    process.exit(2);
  }

  const visionConfigured =
    Boolean((process.env.OPENAI_API_KEY ?? "").trim()) ||
    Boolean((process.env.ANTHROPIC_API_KEY ?? "").trim()) ||
    Boolean((process.env.GOOGLE_AI_API_KEY ?? process.env.GEMINI_API_KEY ?? "").trim());

  const admin = createClient(url, key, { auth: { persistSession: false } });

  const { data: jobs, error } = await admin
    .from("jobs")
    .select(
      "id, tenant_id, type, status, payload, attempts, max_attempts, last_error, last_error_type, created_at, updated_at, dedupe_key"
    )
    .eq("tenant_id", tenantId)
    .eq("type", "ai_analyze_media")
    .eq("status", "dead")
    .order("created_at", { ascending: false })
    .limit(limit);

  if (error) {
    console.error("ERROR: failed to list jobs:", error.message);
    process.exit(1);
  }

  const rows = jobs ?? [];
  const report = {
    mode: execute ? "EXECUTE" : "DRY_RUN",
    tenant_id: "PRESENT",
    vision_configured: visionConfigured,
    scanned: rows.length,
    recoverable: [],
    permanently_unrecoverable: [],
    security_rejected: [],
    provider_configuration_blocked: [],
    requeued: [],
  };

  for (const job of rows) {
    const payload = job.payload ?? {};
    const mediaId = payload.media_id ?? null;
    const uploadSessionId = payload.upload_session_id ?? null;
    const projectId = typeof payload.project_id === "string" ? payload.project_id : null;

    let media = null;
    let session = null;
    if (mediaId) {
      const { data } = await admin
        .from("media")
        .select("id, tenant_id, project_id, file_url")
        .eq("id", mediaId)
        .maybeSingle();
      media = data;
    }
    if (uploadSessionId) {
      const { data } = await admin
        .from("upload_sessions")
        .select("id, tenant_id, status, object_path")
        .eq("id", uploadSessionId)
        .maybeSingle();
      session = data;
    }

    const classification = classifyJobMediaReference({
      media,
      session,
      tenantId,
      supabaseUrl: url,
      projectId,
    });

    if (classification.security_rejected) {
      report.security_rejected.push({
        job_id: job.id,
        reason: classification.reason,
      });
      report.permanently_unrecoverable.push({
        job_id: job.id,
        reason: classification.reason,
        last_error_type: job.last_error_type,
      });
      continue;
    }

    if (!classification.resolvable) {
      report.permanently_unrecoverable.push({
        job_id: job.id,
        reason: classification.reason,
        last_error_type: job.last_error_type,
      });
      continue;
    }

    if (classification.bucketRelativePath) {
      const exists = await storageExists(admin, classification.bucketRelativePath);
      if (!exists.ok && !exists.temporary) {
        report.permanently_unrecoverable.push({
          job_id: job.id,
          reason: "storage_object_missing",
        });
        continue;
      }
      if (!exists.ok && exists.temporary) {
        report.provider_configuration_blocked.push({
          job_id: job.id,
          reason: "storage_temporary_error",
        });
        continue;
      }
    }

    if (!visionConfigured) {
      report.provider_configuration_blocked.push({
        job_id: job.id,
        reason: "AI_PROVIDER_NOT_CONFIGURED",
        note: "Media looks recoverable but no vision provider key is set in this env",
      });
      continue;
    }

    report.recoverable.push({
      job_id: job.id,
      reason: classification.reason,
      previous_error_type: job.last_error_type,
      attempts: job.attempts,
    });

    if (!execute) continue;

    // Never requeue security-rejected (already continued above).
    const { error: updErr } = await admin
      .from("jobs")
      .update({
        status: "queued",
        attempts: 0,
        run_after: new Date().toISOString(),
        last_error: null,
        last_error_type: null,
        locked_by: null,
        locked_at: null,
        updated_at: new Date().toISOString(),
      })
      .eq("id", job.id)
      .eq("tenant_id", tenantId)
      .eq("status", "dead");

    if (updErr) {
      report.permanently_unrecoverable.push({
        job_id: job.id,
        reason: "requeue_update_failed",
      });
    } else {
      report.requeued.push(job.id);
      await admin.from("job_events").insert({
        job_id: job.id,
        event: "retry",
        details: { source: "requeue-dead-ai-analyze-media", dry_run: false },
      });
    }
  }

  console.log(
    JSON.stringify(
      {
        ...report,
        counts: {
          scanned: report.scanned,
          recoverable: report.recoverable.length,
          permanently_unrecoverable: report.permanently_unrecoverable.length,
          security_rejected: report.security_rejected.length,
          provider_configuration_blocked: report.provider_configuration_blocked.length,
          requeued: report.requeued.length,
        },
      },
      null,
      2
    )
  );

  if (!execute) {
    console.error(
      "\nDRY-RUN only. To requeue recoverable jobs:\n" +
        `  node scripts/ops/requeue-dead-ai-analyze-media.mjs --tenant-id=${tenantId} --execute\n` +
        "Do not run --execute on production without explicit owner approval.\n" +
        "Security-rejected jobs are never requeued."
    );
  }
}

const isMain =
  process.argv[1] &&
  resolve(process.argv[1]) === resolve(fileURLToPath(import.meta.url));

if (isMain) {
  main().catch((e) => {
    console.error("ERROR:", e instanceof Error ? e.message : String(e));
    process.exit(1);
  });
}
