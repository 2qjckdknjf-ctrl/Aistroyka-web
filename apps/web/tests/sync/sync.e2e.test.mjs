import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import test from "node:test";

const root = path.resolve(process.cwd());
const artifactDir = process.env.AUDIT_ARTIFACT_DIR || path.join(root, "docs/audit/artifacts/local");
fs.mkdirSync(artifactDir, { recursive: true });

const baseUrl = (process.env.E2E_BASE_URL || "http://127.0.0.1:3000").replace(/\/$/, "");
const deviceId = `audit-${Date.now()}`;
const client = "ios_lite";
const requests = [];

function redact(value) {
  return JSON.stringify(value, null, 2)
    .replace(/Bearer\s+[A-Za-z0-9._-]+/g, "Bearer <redacted>")
    .replace(/"access_token":\s*"[^"]+"/g, '"access_token": "<redacted>"')
    .replace(/"refresh_token":\s*"[^"]+"/g, '"refresh_token": "<redacted>"');
}

async function writeEvidence(name, value) {
  fs.writeFileSync(path.join(artifactDir, `${name}.json`), `${redact(value)}\n`);
}

async function getToken() {
  if (process.env.E2E_ACCESS_TOKEN) return process.env.E2E_ACCESS_TOKEN;

  const email = process.env.E2E_USER_EMAIL || process.env.SMOKE_EMAIL;
  const password = process.env.E2E_USER_PASSWORD || process.env.SMOKE_PASSWORD;
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY;
  assert.ok(email, "E2E_USER_EMAIL or SMOKE_EMAIL is required");
  assert.ok(password, "E2E_USER_PASSWORD or SMOKE_PASSWORD is required");
  assert.ok(supabaseUrl, "NEXT_PUBLIC_SUPABASE_URL or SUPABASE_URL is required for sync E2E token minting");
  assert.ok(anonKey, "NEXT_PUBLIC_SUPABASE_ANON_KEY or SUPABASE_ANON_KEY is required for sync E2E token minting");

  const res = await fetch(`${supabaseUrl.replace(/\/$/, "")}/auth/v1/token?grant_type=password`, {
    method: "POST",
    headers: {
      apikey: anonKey,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ email, password }),
  });
  const body = await res.json().catch(() => ({}));
  await writeEvidence("sync-token-response", { status: res.status, body });
  assert.equal(res.status, 200, `Supabase password grant failed with ${res.status}`);
  assert.ok(body.access_token, "Supabase password grant did not return access_token");
  return body.access_token;
}

async function api(method, route, token, body, extraHeaders = {}) {
  const headers = {
    Authorization: `Bearer ${token}`,
    "Content-Type": "application/json",
    "x-device-id": deviceId,
    "x-client": client,
    "x-request-id": `audit-${Date.now()}-${Math.random().toString(16).slice(2)}`,
    ...extraHeaders,
  };
  const res = await fetch(`${baseUrl}${route}`, {
    method,
    headers,
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  const text = await res.text();
  let json;
  try {
    json = text ? JSON.parse(text) : null;
  } catch {
    json = { raw: text.slice(0, 1000) };
  }
  const evidence = {
    method,
    route,
    status: res.status,
    request_id: res.headers.get("x-request-id"),
    body: json,
  };
  requests.push(evidence);
  return { res, json, evidence };
}

test("Sync Contract & Behavior", async (t) => {
  const token = await getToken();
  let cursor = 0;
  let reportId = "";

  await t.test("auth + device registration", async () => {
    const out = await api("POST", "/api/v1/devices/register", token, {
      device_id: deviceId,
      platform: "ios",
      token: `audit-token-${deviceId}`,
    });
    assert.ok([200, 201, 503].includes(out.res.status), `device register returned ${out.res.status}`);
  });

  await t.test("bootstrap", async () => {
    const out = await api("GET", "/api/v1/sync/bootstrap", token);
    assert.equal(out.res.status, 200);
    assert.ok(out.json.serverTime, "bootstrap serverTime missing");
    assert.equal(typeof out.json.cursor, "number");
    assert.ok(Array.isArray(out.json.data.tasks), "bootstrap tasks missing");
    assert.ok(Array.isArray(out.json.data.reports), "bootstrap reports missing");
    assert.ok(Array.isArray(out.json.data.uploadSessions), "bootstrap uploadSessions missing");
    cursor = out.json.cursor;
  });

  await t.test("changes no-op", async () => {
    const out = await api("GET", `/api/v1/sync/changes?cursor=${cursor}&limit=25`, token);
    assert.equal(out.res.status, 200);
    assert.ok(Array.isArray(out.json.data.changes), "changes array missing");
    assert.equal(typeof out.json.next_cursor, "number");
    assert.ok(out.json.server_time, "changes server_time missing");
  });

  await t.test("mutation propagation via report create", async () => {
    const idempotencyKey = `audit-report-create-${Date.now()}`;
    const out = await api("POST", "/api/v1/worker/report/create", token, {}, {
      "x-idempotency-key": idempotencyKey,
    });
    assert.equal(out.res.status, 200);
    reportId = out.json?.data?.id || out.json?.data?.report_id || "";
    assert.ok(reportId, "report create did not return report id");

    const deadline = Date.now() + 15_000;
    let seen = false;
    while (Date.now() < deadline && !seen) {
      const changes = await api("GET", `/api/v1/sync/changes?cursor=${cursor}&limit=100`, token);
      assert.equal(changes.res.status, 200);
      seen = changes.json.data.changes.some((change) => change.resource_id === reportId);
      if (changes.json.next_cursor > cursor) cursor = changes.json.next_cursor;
      if (!seen) await new Promise((resolve) => setTimeout(resolve, 1000));
    }
    assert.equal(seen, true, "created report did not appear in sync changes before timeout");
  });

  await t.test("ack", async () => {
    const out = await api("POST", "/api/v1/sync/ack", token, { cursor }, {
      "x-idempotency-key": `audit-ack-${cursor}`,
    });
    assert.equal(out.res.status, 200);
    assert.equal(out.json.ok, true);
    assert.equal(out.json.cursor, cursor);

    const after = await api("GET", `/api/v1/sync/changes?cursor=${cursor}&limit=25`, token);
    assert.equal(after.res.status, 200);
    assert.equal(after.json.data.changes.some((change) => change.resource_id === reportId), false);
  });

  await t.test("idempotency for report create and ack", async () => {
    const createKey = `audit-create-dup-${Date.now()}`;
    const first = await api("POST", "/api/v1/worker/report/create", token, {}, {
      "x-idempotency-key": createKey,
    });
    const second = await api("POST", "/api/v1/worker/report/create", token, {}, {
      "x-idempotency-key": createKey,
    });
    assert.equal(first.res.status, 200);
    assert.equal(second.res.status, 200);
    assert.deepEqual(second.json, first.json);

    const ackKey = `audit-ack-dup-${Date.now()}`;
    const ackA = await api("POST", "/api/v1/sync/ack", token, { cursor }, {
      "x-idempotency-key": ackKey,
    });
    const ackB = await api("POST", "/api/v1/sync/ack", token, { cursor }, {
      "x-idempotency-key": ackKey,
    });
    assert.equal(ackA.res.status, 200);
    assert.equal(ackB.res.status, 200);
    assert.deepEqual(ackB.json, ackA.json);
  });

  await t.test("conflict simulation best effort", async () => {
    const ahead = cursor + 1_000_000;
    const out = await api("GET", `/api/v1/sync/changes?cursor=${ahead}&limit=25`, token, undefined, {
      "x-device-id": `${deviceId}-conflict`,
    });
    assert.ok([200, 409].includes(out.res.status), `conflict probe returned ${out.res.status}`);
    if (out.res.status === 200) {
      assert.ok(out.json.data, "conflict probe 200 response missing data");
    } else {
      assert.ok(out.json.error || out.json.code || out.json.serverCursor !== undefined, "conflict response missing deterministic signal");
    }
  });

  await writeEvidence("sync-e2e-requests", requests);
});
