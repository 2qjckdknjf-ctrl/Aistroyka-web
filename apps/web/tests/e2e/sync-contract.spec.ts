import { expect, test } from "@playwright/test";
import fs from "node:fs";
import path from "node:path";
import { e2eLocale } from "./_helpers/routes";

const device1 = process.env.E2E_DEVICE_ID || "e2e-device-1";
const device2 = process.env.E2E_DEVICE_ID_2 || "e2e-device-2";

function syncContractLogPath() {
  const base = process.env.AUDIT_ARTIFACT_DIR
    ? path.join(process.env.AUDIT_ARTIFACT_DIR, "sync-logs")
    : path.join(process.cwd(), "../../docs/audit/artifacts/local/sync-logs");
  fs.mkdirSync(base, { recursive: true });
  return path.join(base, "sync-contract.log");
}

function redact(line: string) {
  return line
    .replace(/Bearer\s+\S+/gi, "Bearer <redacted>")
    .replace(/"access_token"\s*:\s*"[^"]+"/g, '"access_token":"<redacted>"');
}

function logLine(file: string, msg: string) {
  fs.appendFileSync(file, `${redact(msg)}\n`);
}

test.describe("Sync contract (API)", () => {
  test.beforeEach(async ({ page }) => {
    const baseURL = process.env.PLAYWRIGHT_BASE_URL ?? "http://localhost:3000";
    await page.goto(`${baseURL}/${e2eLocale}/dashboard`);
  });

  test("7.1 bootstrap rejects missing x-device-id", async ({ page }) => {
    const res = await page.request.get("/api/v1/sync/bootstrap");
    expect(res.status()).not.toBe(200);
    expect([400, 401, 403]).toContain(res.status());
  });

  test("7.1 bootstrap succeeds with x-device-id", async ({ page }) => {
    const res = await page.request.get("/api/v1/sync/bootstrap", {
      headers: { "x-device-id": device1 },
    });
    expect(res.status()).toBe(200);
    const body = await res.json();
    expect(typeof body.cursor).toBe("number");
    expect(body.data?.tasks).toBeDefined();
    expect(body.data?.reports).toBeDefined();
    expect(body.data?.uploadSessions).toBeDefined();
  });

  test("7.2 bootstrap shape", async ({ page }) => {
    const res = await page.request.get("/api/v1/sync/bootstrap", {
      headers: { "x-device-id": device1 },
    });
    expect(res.status()).toBe(200);
    const body = await res.json();
    expect(typeof body.cursor).toBe("number");
    expect(typeof body.serverTime).toBe("string");
    expect(Array.isArray(body.data.tasks)).toBeTruthy();
    expect(Array.isArray(body.data.reports)).toBeTruthy();
    expect(Array.isArray(body.data.uploadSessions)).toBeTruthy();
  });

  test("7.3 changes no-op", async ({ page }) => {
    const boot = await page.request.get("/api/v1/sync/bootstrap", {
      headers: { "x-device-id": device1 },
    });
    expect(boot.status()).toBe(200);
    const b = await boot.json();
    const cursor = b.cursor as number;
    const res = await page.request.get(`/api/v1/sync/changes?cursor=${cursor}&limit=50`, {
      headers: { "x-device-id": device1 },
    });
    expect(res.status()).toBe(200);
    const body = await res.json();
    expect(Array.isArray(body.data.changes)).toBeTruthy();
    expect(typeof body.next_cursor).toBe("number");
  });

  test("7.4 ack idempotency (lite client)", async ({ page }) => {
    const logFile = syncContractLogPath();
    const boot = await page.request.get("/api/v1/sync/bootstrap", {
      headers: { "x-device-id": device1, "x-client": "ios_lite" },
    });
    expect(boot.status()).toBe(200);
    const b = await boot.json();
    const cursor = b.cursor as number;
    const key = `ack-${device1}-${cursor}`;
    const headers = {
      "x-device-id": device1,
      "x-client": "ios_lite",
      "x-idempotency-key": key,
    };
    const first = await page.request.post("/api/v1/sync/ack", { headers, data: { cursor } });
    expect(first.status()).toBe(200);
    const second = await page.request.post("/api/v1/sync/ack", { headers, data: { cursor } });
    expect(second.status()).toBe(200);
    const j1 = await first.json();
    const j2 = await second.json();
    expect(j2).toEqual(j1);
    logLine(logFile, JSON.stringify({ step: "ack_idempotent", cursor, status: second.status() }));
  });

  test("7.5 409 conflict recovery (future cursor)", async ({ page }) => {
    const logFile = syncContractLogPath();
    const boot = await page.request.get("/api/v1/sync/bootstrap", {
      headers: { "x-device-id": device1 },
    });
    expect(boot.status()).toBe(200);
    const b = await boot.json();
    const cursor = b.cursor as number;
    const future = cursor + 999_999;
    const conflict = await page.request.get(`/api/v1/sync/changes?cursor=${future}&limit=25`, {
      headers: { "x-device-id": device1 },
    });
    expect(conflict.status()).toBe(409);
    const cbody = await conflict.json();
    expect(cbody.error).toBe("conflict");
    expect(cbody.code).toBe("sync_conflict");
    expect(typeof (cbody.serverCursor ?? cbody.server_cursor)).toBe("number");
    expect(cbody.must_bootstrap).toBe(true);

    const serverCursor = (cbody.serverCursor ?? cbody.server_cursor) as number;

    const boot2 = await page.request.get("/api/v1/sync/bootstrap", {
      headers: { "x-device-id": device1 },
    });
    expect(boot2.status()).toBe(200);
    const b2 = await boot2.json();
    const newCursor = (b2.cursor as number) ?? serverCursor;

    const changes = await page.request.get(`/api/v1/sync/changes?cursor=${newCursor}&limit=25`, {
      headers: { "x-device-id": device1 },
    });
    expect(changes.status()).toBe(200);

    const ack = await page.request.post("/api/v1/sync/ack", {
      headers: { "x-device-id": device1 },
      data: { cursor: newCursor },
    });
    expect(ack.status()).toBe(200);
    logLine(logFile, JSON.stringify({ step: "409_recovery", serverCursor, newCursor }));
  });

  test("7.6 two-device basic ack", async ({ page }) => {
    const a = await page.request.get("/api/v1/sync/bootstrap", { headers: { "x-device-id": device1 } });
    const b = await page.request.get("/api/v1/sync/bootstrap", { headers: { "x-device-id": device2 } });
    expect(a.status()).toBe(200);
    expect(b.status()).toBe(200);
    const ca = (await a.json()).cursor as number;
    const cb = (await b.json()).cursor as number;
    const ack1 = await page.request.post("/api/v1/sync/ack", {
      headers: { "x-device-id": device1, "x-client": "ios_lite", "x-idempotency-key": `ack-${device1}-${ca}-7.6` },
      data: { cursor: ca },
    });
    const ack2 = await page.request.post("/api/v1/sync/ack", {
      headers: { "x-device-id": device2, "x-client": "ios_lite", "x-idempotency-key": `ack-${device2}-${cb}-7.6` },
      data: { cursor: cb },
    });
    expect(ack1.status()).toBe(200);
    expect(ack2.status()).toBe(200);
  });
});
