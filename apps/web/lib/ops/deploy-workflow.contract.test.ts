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

  it("live workflow rejects unknown targets before retrying any host", () => {
    expect(live).toMatch(/case "\$TARGET" in/);
    expect(live).toMatch(/production\|staging\|both\) ;;/);
    expect(live).toMatch(/invalid target=\$TARGET/);
    expect(live).toMatch(/invalid target=\$TARGET[\s\S]*exit 2/);
    expect(live.indexOf('case "$TARGET" in')).toBeLessThan(
      live.indexOf('for attempt in $(seq 1 "$max_pair_attempts")'),
    );
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
    expect(smoke).toMatch(/SECURITY_HEADERS_CONNECT_TIMEOUT_SEC:-5/);
    expect(smoke).toMatch(/SECURITY_HEADERS_REQUEST_MAX_TIME_SEC:-12/);
    expect(smoke).toMatch(/--connect-timeout "\$CONNECT_TIMEOUT_SEC"/);
    expect(smoke).toMatch(/--max-time "\$REQUEST_MAX_TIME_SEC"/);
    expect(smoke).toMatch(/hop\$\{hop\}-of-\$\{hop_count\}/);
    expect(smoke).toMatch(/Validate intermediate redirect responses/);
    expect(smoke).toMatch(/SECURITY_HEADERS_ALLOW_LOCALHOST/);
    expect(smoke).toMatch(/--proto-redir/);
    expect(smoke).toMatch(/url_effective outside selected environment/);
    expect(smoke).toMatch(/redirect Location outside selected environment/);
    expect(smoke).toMatch(/normalize_url_scheme/);
    expect(smoke).toMatch(/is_allowed_redirect_origin/);
    expect(smoke).toMatch(/staging → staging only|staging only/);
    expect(smoke).toMatch(/apex↔www only|production apex/);
  });

  it("normalizes uppercase redirect schemes/hosts before allowlist match", () => {
    const upper = dryResolve({ SECURITY_HEADERS_BASE_URL: "HTTPS://WWW.aistroyka.ai" });
    expect(upper.status).toBe(0);
    expect(upper.out).toMatch(/resolved_base=https:\/\/www\.aistroyka\.ai/);

    const evilUpper = dryResolve({ SECURITY_HEADERS_BASE_URL: "HTTPS://evil.example" });
    expect(evilUpper.status).not.toBe(0);
    expect(evilUpper.out).toMatch(/disallowed target fail-closed/);
  });

  it("localhost remains fail-closed without opt-in allow", () => {
    const denied = dryResolve({ SECURITY_HEADERS_BASE_URL: "http://127.0.0.1:9" });
    expect(denied.status).not.toBe(0);
    expect(denied.out).toMatch(/disallowed target fail-closed/);
  });

  it(
    "mocked host validates redirect hop headers on 302→200 chain",
    () => {
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
    },
    20_000,
  );

  it(
    "mocked host rejects missing CSP on intermediate 302 hop",
    () => {
      const runner = resolve(root, "scripts/smoke/security_headers_mock_host.py");
      const bad = spawnSync("python3", [runner, "missing-redirect-csp"], {
        cwd: root,
        encoding: "utf8",
        env: { ...process.env },
      });
      const badOut = `${bad.stdout || ""}${bad.stderr || ""}`;
      expect(bad.status, badOut).not.toBe(0);
      expect(badOut).toMatch(/missing header content-security-policy/);
      expect(badOut).toMatch(/hop1-of-2/);
    },
    20_000,
  );

  it(
    "mocked host ignores 103 Early Hints and validates the final response",
    () => {
      const runner = resolve(root, "scripts/smoke/security_headers_mock_host.py");
      const earlyHints = spawnSync("python3", [runner, "early-hints"], {
        cwd: root,
        encoding: "utf8",
        env: { ...process.env },
      });
      const earlyHintsOut = `${earlyHints.stdout || ""}${earlyHints.stderr || ""}`;
      expect(earlyHints.status, earlyHintsOut).toBe(0);
      expect(earlyHintsOut).toMatch(/public-home\/hop1-of-1/);
      expect(earlyHintsOut).not.toMatch(/public-home\/hop2-of-2/);
    },
    20_000,
  );

  it("fits advertised serial retry budgets inside live and production job timeouts", () => {
    const requestMaxSeconds = Number(
      smoke.match(/SECURITY_HEADERS_REQUEST_MAX_TIME_SEC:-([0-9]+)/)?.[1],
    );
    const liveTimeoutSeconds =
      Number(live.match(/timeout-minutes:\s*([0-9]+)/)?.[1]) * 60;
    const liveAttempts = Number(live.match(/max_pair_attempts=([0-9]+)/)?.[1]);
    const liveSleepSeconds = Number(live.match(/sleep_sec=([0-9]+)/)?.[1]);
    const prodHeadersJob = prod.match(
      /security-headers-smoke:[\s\S]*?timeout-minutes:\s*([0-9]+)/,
    );
    const prodTimeoutSeconds = Number(prodHeadersJob?.[1]) * 60;
    const prodAttempts = Number(prod.match(/max_pair_attempts=([0-9]+)/)?.[1]);
    const prodSleepSeconds = Number(prod.match(/sleep_sec=([0-9]+)/)?.[1]);
    const probesPerHost = 5;

    expect(requestMaxSeconds).toBe(12);
    expect(
      3 * probesPerHost * requestMaxSeconds * liveAttempts +
        (liveAttempts - 1) * liveSleepSeconds,
    ).toBeLessThan(liveTimeoutSeconds);
    expect(
      2 * probesPerHost * requestMaxSeconds * prodAttempts +
        (prodAttempts - 1) * prodSleepSeconds,
    ).toBeLessThan(prodTimeoutSeconds);
  });
});

function runPromotionGuard(env: NodeJS.ProcessEnv): { status: number; out: string } {
  const r = spawnSync("bash", ["scripts/release/production-promotion-guard.sh"], {
    cwd: root,
    env: { ...process.env, ...env },
    encoding: "utf8",
  });
  return { status: r.status ?? 1, out: `${r.stdout || ""}${r.stderr || ""}` };
}

describe("Phase 8 production promotion fail-closed (T7)", () => {
  const prod = read(".github/workflows/deploy-cloudflare-prod.yml");
  const staging = read(".github/workflows/deploy-cloudflare-staging.yml");
  const live = read(".github/workflows/security-headers-live.yml");
  const guard = read("scripts/release/production-promotion-guard.sh");
  const goodSha = "8408ca26c3db1a88cd5166c9dc86458ec630bf4d";

  it("prod workflow wires no-promotion-guard before migrations/deploy", () => {
    expect(prod).toMatch(/no-promotion-guard:/);
    expect(prod).toMatch(/Production promotion guard/);
    expect(prod).toMatch(/production-promotion-guard\.sh/);
    expect(prod).toMatch(
      /migrations-preflight:[\s\S]*needs:\s*\[no-promotion-guard\]/,
    );
    expect(prod).toMatch(
      /deploy:[\s\S]*needs:\s*\[no-promotion-guard,\s*migrations-preflight\]/,
    );
    expect(prod).toMatch(/permissions:\s*\n\s*contents:\s*read\s*\n\s*actions:\s*read/);
    expect(prod).not.toMatch(/permissions:[\s\S]*write|contents:\s*write|deployments:\s*write/);
  });

  it("exact skip marker blocks promotion; near-miss does not", () => {
    const blocked = runPromotionGuard({
      EVENT_NAME: "workflow_run",
      STAGING_CONCLUSION: "success",
      STAGING_HEAD_SHA: goodSha,
      COMMIT_MESSAGE: "ci: headers [skip-staging-deploy]\n",
    });
    expect(blocked.status).not.toBe(0);
    expect(blocked.out).toMatch(/skip-staging-deploy/);
    expect(blocked.out).toMatch(/FAIL/);

    const nearMiss = runPromotionGuard({
      EVENT_NAME: "workflow_run",
      STAGING_CONCLUSION: "success",
      STAGING_HEAD_SHA: goodSha,
      COMMIT_MESSAGE: "ci: headers [skip-staging-deployX] skip staging deploy\n",
    });
    expect(nearMiss.status).toBe(0);
    expect(nearMiss.out).toMatch(/OK promote/);
  });

  it("staging failure / missing metadata fail closed", () => {
    const stagingFail = runPromotionGuard({
      EVENT_NAME: "workflow_run",
      STAGING_CONCLUSION: "failure",
      STAGING_HEAD_SHA: goodSha,
      COMMIT_MESSAGE: "merge without marker",
    });
    expect(stagingFail.status).not.toBe(0);
    expect(stagingFail.out).toMatch(/staging conclusion=failure/);

    const missingSha = runPromotionGuard({
      EVENT_NAME: "workflow_run",
      STAGING_CONCLUSION: "success",
      STAGING_HEAD_SHA: "",
      COMMIT_MESSAGE: "ok",
    });
    expect(missingSha.status).not.toBe(0);
    expect(missingSha.out).toMatch(/missing staging head SHA/);

    const badSha = runPromotionGuard({
      EVENT_NAME: "workflow_run",
      STAGING_CONCLUSION: "success",
      STAGING_HEAD_SHA: "not-a-sha",
      COMMIT_MESSAGE: "ok",
    });
    expect(badSha.status).not.toBe(0);
    expect(badSha.out).toMatch(/malformed staging head SHA/);

    const missingConclusion = runPromotionGuard({
      EVENT_NAME: "workflow_run",
      STAGING_CONCLUSION: "",
      STAGING_HEAD_SHA: goodSha,
      COMMIT_MESSAGE: "ok",
    });
    expect(missingConclusion.status).not.toBe(0);
    expect(missingConclusion.out).toMatch(/missing staging conclusion/);
  });

  it("valid staging success without marker remains allowed; dispatch allowed", () => {
    const ok = runPromotionGuard({
      EVENT_NAME: "workflow_run",
      STAGING_CONCLUSION: "success",
      STAGING_HEAD_SHA: goodSha,
      COMMIT_MESSAGE: "ci: Security Headers Live Smoke + consecutive retry",
    });
    expect(ok.status).toBe(0);
    expect(ok.out).toMatch(new RegExp(`OK promote sha=${goodSha}`));

    const dispatch = runPromotionGuard({
      EVENT_NAME: "workflow_dispatch",
      STAGING_CONCLUSION: "",
      STAGING_HEAD_SHA: "",
      COMMIT_MESSAGE: "",
    });
    expect(dispatch.status).toBe(0);
    expect(dispatch.out).toMatch(/workflow_dispatch/);
  });

  it("unexpected event fails closed; guard has no shell injection via expressions", () => {
    const weird = runPromotionGuard({
      EVENT_NAME: "pull_request",
      STAGING_CONCLUSION: "success",
      STAGING_HEAD_SHA: goodSha,
      COMMIT_MESSAGE: "ok",
    });
    expect(weird.status).not.toBe(0);
    expect(weird.out).toMatch(/unexpected event/);

    expect(guard).not.toMatch(/eval |curl .*\$\{|\$\(\s*curl/);
    expect(prod).not.toMatch(/\$\{\{\s*github\.event\.workflow_run\.head_commit\.message\s*\}\}/);
    expect(guard).not.toMatch(/Authorization:|Bearer |api[_-]?key/i);
  });

  it("header-only workflow stays independent of staging/prod promotion", () => {
    expect(live).not.toMatch(/skip-staging-deploy|no-promotion-guard|workflow_run/);
    expect(live).toMatch(/workflow_dispatch/);
    expect(staging).toMatch(/skip-staging-deploy-guard/);
  });
});
