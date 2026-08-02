/**
 * Call-site contract: HTTP/RSC paths must pass request or await headers() into
 * active-tenant resolvers — not merely any second argument (null/undefined/literals fail).
 *
 * Allowlisted requestless definitions / forwarders only (documented):
 * - lib/api/engine.ts
 * - lib/supabase/rpc.ts
 * - lib/onboarding/user-onboarding.ts
 * - lib/tenant/tenant-role.server.ts (function signature)
 * - lib/tenant/active-tenant.ts (resolver core)
 */
import { readFileSync, readdirSync, statSync } from "node:fs";
import { join, relative } from "node:path";
import { describe, expect, it } from "vitest";

const WEB_ROOT = join(__dirname, "../..");

const REQUESTLESS_ALLOWLIST = new Set([
  "lib/api/engine.ts",
  "lib/supabase/rpc.ts",
  "lib/onboarding/user-onboarding.ts",
  "lib/tenant/tenant-role.server.ts",
  "lib/tenant/active-tenant.ts",
]);

const ENGINE_CALL =
  /\b(getTenantForCurrentUser|getOrCreateTenantForCurrentUser|getDefaultTenantId|createTenantAndOwnerMembershipForCurrentUser|resolveTenantForCurrentUser)\s*\(/g;
const ROLE_CALL = /\bgetActiveTenantRoleForUser\s*\(/g;
const RPC_TENANT_CALL =
  /\b(listProjectsForUser|getProjectById|createProject|triggerAnalysisForMedia)\s*\(/g;

function walkTsFiles(dir: string, out: string[] = []): string[] {
  for (const name of readdirSync(dir)) {
    if (name === "node_modules" || name === ".next" || name === "dist") continue;
    const full = join(dir, name);
    const st = statSync(full);
    if (st.isDirectory()) walkTsFiles(full, out);
    else if (/\.(ts|tsx)$/.test(name) && !name.endsWith(".test.ts") && !name.endsWith(".test.tsx")) {
      out.push(full);
    }
  }
  return out;
}

function stripComments(src: string): string {
  return src.replace(/\/\*[\s\S]*?\*\//g, "").replace(/^\s*\/\/.*$/gm, "");
}

/** Parse top-level call arguments; respects nested (), {}, []. */
function parseCallArgs(callSnippet: string): string[] {
  const open = callSnippet.indexOf("(");
  if (open < 0) return [];
  const args: string[] = [];
  let depth = 0;
  let brace = 0;
  let bracket = 0;
  let inStr: string | null = null;
  let start = open + 1;
  for (let i = open; i < callSnippet.length; i++) {
    const ch = callSnippet[i]!;
    if (inStr) {
      if (ch === "\\") {
        i++;
        continue;
      }
      if (ch === inStr) inStr = null;
      continue;
    }
    if (ch === '"' || ch === "'" || ch === "`") {
      inStr = ch;
      continue;
    }
    if (ch === "(") {
      depth++;
      continue;
    }
    if (ch === ")") {
      depth--;
      if (depth === 0) {
        args.push(callSnippet.slice(start, i).trim());
        break;
      }
      continue;
    }
    if (ch === "{") {
      brace++;
      continue;
    }
    if (ch === "}") {
      brace--;
      continue;
    }
    if (ch === "[") {
      bracket++;
      continue;
    }
    if (ch === "]") {
      bracket--;
      continue;
    }
    if (ch === "," && depth === 1 && brace === 0 && bracket === 0) {
      args.push(callSnippet.slice(start, i).trim());
      start = i + 1;
    }
  }
  return args.filter((a) => a.length > 0);
}

function isHttpContextExpr(expr: string): boolean {
  const t = expr.replace(/\s+/g, " ").trim();
  if (!t) return false;
  if (/^(null|undefined|true|false)$/.test(t)) return false;
  if (/^["'`]/.test(t)) return false;
  if (/^\d/.test(t)) return false;
  if (/^(request|req)$/.test(t)) return true;
  if (/^await headers\(\)$/.test(t)) return true;
  if (/^headersList$/.test(t)) return true;
  if (/^asActiveTenantRequest\(\s*(?:await\s+)?headers\(\)\s*\)$/.test(t)) return true;
  if (/^asActiveTenantRequest\(\s*(?:request|req|headersList)\s*\)$/.test(t)) return true;
  return false;
}

function requestArgIndex(fn: string): number {
  switch (fn) {
    case "listProjectsForUser":
    case "getTenantForCurrentUser":
    case "getOrCreateTenantForCurrentUser":
    case "getDefaultTenantId":
    case "resolveTenantForCurrentUser":
      return 1;
    case "getActiveTenantRoleForUser":
    case "createProject":
    case "getProjectById":
    case "createTenantAndOwnerMembershipForCurrentUser":
      return 2;
    case "triggerAnalysisForMedia":
      return 3;
    default:
      return -1;
  }
}

function checkCalls(
  src: string,
  rel: string,
  re: RegExp,
  nameFromMatch: (m: RegExpExecArray) => string,
  violations: string[]
) {
  re.lastIndex = 0;
  let m: RegExpExecArray | null;
  while ((m = re.exec(src))) {
    const fnName = nameFromMatch(m);
    const start = m.index;
    const snippet = src.slice(start, Math.min(src.length, start + 600));
    const args = parseCallArgs(snippet);
    const idx = requestArgIndex(fnName);
    const arg = idx >= 0 ? args[idx] : undefined;
    if (!arg || !isHttpContextExpr(arg)) {
      violations.push(
        `${rel}: ${fnName}(...) missing HTTP context arg (got ${JSON.stringify(arg ?? "<missing>")})\n  ${snippet.split("\n")[0]}`
      );
    }
  }
}

describe("active-tenant request propagation contract", () => {
  it("HTTP/RSC call sites pass request or await headers() (not arity-only)", () => {
    const files = [
      ...walkTsFiles(join(WEB_ROOT, "app")),
      ...walkTsFiles(join(WEB_ROOT, "lib")),
      join(WEB_ROOT, "middleware.ts"),
    ];
    const all = [...new Set(files)].filter((f) => {
      try {
        return statSync(f).isFile();
      } catch {
        return false;
      }
    });

    const violations: string[] = [];

    for (const file of all) {
      const rel = relative(WEB_ROOT, file).replace(/\\/g, "/");
      if (REQUESTLESS_ALLOWLIST.has(rel)) continue;

      const src = stripComments(readFileSync(file, "utf8"));
      const importsRpc = /from\s+["']@\/lib\/supabase\/rpc["']/.test(src);

      checkCalls(src, rel, ENGINE_CALL, (m) => m[1]!, violations);
      checkCalls(src, rel, ROLE_CALL, () => "getActiveTenantRoleForUser", violations);

      if (importsRpc) {
        checkCalls(src, rel, RPC_TENANT_CALL, (m) => m[1]!, violations);
      }
    }

    expect(violations, violations.join("\n")).toEqual([]);
  });

  it("rejects null/undefined as HTTP context expressions", () => {
    expect(isHttpContextExpr("null")).toBe(false);
    expect(isHttpContextExpr("undefined")).toBe(false);
    expect(isHttpContextExpr("request")).toBe(true);
    expect(isHttpContextExpr("await headers()")).toBe(true);
    expect(isHttpContextExpr('"x-tenant-id"')).toBe(false);
  });

  it("parseCallArgs keeps object literals as one argument", () => {
    const args = parseCallArgs(
      `createTenantAndOwnerMembershipForCurrentUser(\n  supabase,\n  {\n    name: companyName || "New company",\n    companyType,\n  },\n  request\n)`
    );
    expect(args).toHaveLength(3);
    expect(args[2]).toBe("request");
  });
});
