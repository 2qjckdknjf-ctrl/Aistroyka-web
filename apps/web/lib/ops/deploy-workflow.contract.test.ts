import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { spawnSync } from "node:child_process";

const root = resolve(__dirname, "../../../../");

function read(rel: string): string {
  return readFileSync(resolve(root, rel), "utf8");
}

function dryResolve(env: NodeJS.ProcessEnv, args: string[] = []): { status: number; out: string } {
  const r = spawnSync("bash", ["scripts/smoke/security_headers.sh", ...args], {
    cwd: root,
    env: { ...process.env, ...env, SECURITY_HEADERS_DRY_RESOLVE: "1" },
    encoding: "utf8",
  });
  return { status: r.status ?? 1, out: `${r.stdout || ""}${r.stderr || ""}` };
}

describe("Phase 8 security-headers CI contract", () => {
  const staging = read(".github/workflows/deploy-cloudflare-staging.yml");
  const prod = read(".github/workflows/deploy-cloudflare-prod.yml");
  const live = read(".github/workflows/security-headers-live.yml");
  const smoke = read("scripts/smoke/security_headers.sh");

  it("security_headers.sh rejects duplicates/joins and supports consecutive retry env", () => {
    expect(smoke).toMatch(/duplicate header/);
    expect(smoke).toMatch(/joined\/multi value/);
    expect(smoke).toMatch(/SECURITY_HEADERS_REQUIRE_CONSECUTIVE/);
    expect(smoke).toMatch(/SECURITY_HEADERS_MAX_ATTEMPTS/);
    expect(smoke).toMatch(/SECURITY_HEADERS_RETRY_SLEEP_SEC/);
    expect(smoke).toMatch(/is_allowed_base/);
    expect(smoke).toMatch(/SECURITY_HEADERS_DRY_RESOLVE/);
  });

  it("resolves www/apex/staging targets without defaulting to www", () => {
    const www = dryResolve({ SECURITY_HEADERS_BASE_URL: "https://www.aistroyka.ai" });
    expect(www.status).toBe(0);
    expect(www.out).toMatch(/resolved_base=https:\/\/www\.aistroyka\.ai/);

    const apex = dryResolve({ SECURITY_HEADERS_BASE_URL: "https://aistroyka.ai" });
    expect(apex.status).toBe(0);
    expect(apex.out).toMatch(/resolved_base=https:\/\/aistroyka\.ai/);

    const stagingHost = dryResolve({ SECURITY_HEADERS_BASE_URL: "https://staging.aistroyka.ai" });
    expect(stagingHost.status).toBe(0);
    expect(stagingHost.out).toMatch(/resolved_base=https:\/\/staging\.aistroyka\.ai/);

    // positional wins over a conflicting env default
    const pos = dryResolve(
      { SECURITY_HEADERS_BASE_URL: "https://www.aistroyka.ai" },
      ["https://staging.aistroyka.ai"],
    );
    expect(pos.status).toBe(0);
    expect(pos.out).toMatch(/resolved_base=https:\/\/staging\.aistroyka\.ai/);
  });

  it("fail-closes empty positional and disallowed targets", () => {
    const emptyPos = dryResolve({}, [""]);
    expect(emptyPos.status).not.toBe(0);
    expect(emptyPos.out).toMatch(/empty positional target fail-closed/);

    const bad = dryResolve({ SECURITY_HEADERS_BASE_URL: "https://evil.example" });
    expect(bad.status).not.toBe(0);
    expect(bad.out).toMatch(/disallowed target fail-closed/);
  });

  it("live workflow passes host only via SECURITY_HEADERS_BASE_URL", () => {
    expect(live).toMatch(/SECURITY_HEADERS_BASE_URL="\$host"/);
    expect(live).toMatch(/env -u BASE_URL/);
    // must not rely on ignored positional alone
    expect(live).not.toMatch(/bash scripts\/smoke\/security_headers\.sh "\$host"/);
    expect(live).toMatch(/permissions:\s*\n\s*contents:\s*read/);
    expect(live).toMatch(/require=2/);
    expect(live).toMatch(/www\.aistroyka\.ai/);
    expect(live).toMatch(/aistroyka\.ai/);
    expect(live).toMatch(/staging\.aistroyka\.ai/);
    expect(live).not.toMatch(/Authorization|Bearer|PILOT_SMOKE/);
    expect(live).not.toMatch(/wrangler deploy|workflow_run/);
    expect(live).toMatch(/type:\s*choice/);
  });

  it("production security headers job requires consecutive www+apex pair passes", () => {
    expect(prod).toMatch(/2 consecutive/);
    expect(prod).toMatch(/consecutive pair/);
    expect(prod).toMatch(/require=2/);
    expect(prod).toMatch(/SECURITY_HEADERS_BASE_URL=/);
    expect(prod).toMatch(/www\.aistroyka\.ai/);
    expect(prod).toMatch(/aistroyka\.ai/);
  });

  it("staging skip-staging-deploy guard fails closed and gates preflight", () => {
    expect(staging).toMatch(/skip-staging-deploy-guard/);
    expect(staging).toMatch(/\[skip-staging-deploy\]/);
    expect(staging).toMatch(/Fail intentionally \(block prod promote\)/);
    expect(staging).toMatch(
      /migrations-preflight:[\s\S]*if:\s*\$\{\{ !\(github\.event_name == 'push' && contains\(github\.event\.head_commit\.message, '\[skip-staging-deploy\]'\)\) \}\}/,
    );
    // Exact marker required; header-only workflow independent of staging deploy.
    expect(live).not.toMatch(/skip-staging-deploy/);
    expect(live).toMatch(/workflow_dispatch/);
    // deploy job still exists for normal pushes (not gated by a loose contains that would always skip)
    expect(staging).toMatch(/name: Build and deploy to staging/);
  });

  it("script never uses auth headers; checks curl exit and redirect hops", () => {
    expect(smoke).not.toMatch(/Authorization:|Bearer |--location-trusted/);
    expect(smoke).toMatch(/never send credentials or auth headers/);
    expect(smoke).toMatch(/curl exit/);
    expect(smoke).toMatch(/fail-closed before header accept/);
    expect(smoke).toMatch(/hop\$\{hop\}-of-\$\{hop_count\}/);
    expect(smoke).toMatch(/Validate intermediate redirect responses/);
    expect(smoke).toMatch(/SECURITY_HEADERS_ALLOW_LOCALHOST/);
  });

  it("localhost remains fail-closed without opt-in allow", () => {
    const denied = dryResolve({ SECURITY_HEADERS_BASE_URL: "http://127.0.0.1:9" });
    expect(denied.status).not.toBe(0);
    expect(denied.out).toMatch(/disallowed target fail-closed/);
  });

  it("mocked host validates redirect hop headers and rejects missing CSP on 302", () => {
    const runner = resolve(root, "scripts/smoke/security_headers_mock_host.py");
    const ok = spawnSync("python3", [runner, "ok"], {
      cwd: root,
      encoding: "utf8",
      env: { ...process.env },
    });
    const okOut = `${ok.stdout || ""}${ok.stderr || ""}`;
    expect(ok.status, okOut).toBe(0);
    expect(okOut).toMatch(/protected-redirect\/hop1-of-2/);
    expect(okOut).toMatch(/protected-redirect\/hop2-of-2/);

    const bad = spawnSync("python3", [runner, "missing-redirect-csp"], {
      cwd: root,
      encoding: "utf8",
      env: { ...process.env },
    });
    const badOut = `${bad.stdout || ""}${bad.stderr || ""}`;
    expect(bad.status, badOut).not.toBe(0);
    expect(badOut).toMatch(/missing header content-security-policy/);
    expect(badOut).toMatch(/hop1-of-2/);
  });
});
