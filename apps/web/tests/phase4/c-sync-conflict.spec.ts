import { expect, test } from "@playwright/test";
import {
  authPasswordGrant,
  me,
  mobileHeaders,
  personaCredentials,
  requiredFixture,
} from "./helpers";

type ConflictBody = {
  error: "conflict";
  code: "sync_conflict";
  server_cursor: number;
  serverCursor: number;
  must_bootstrap?: boolean;
  hint?: string;
};

test.describe("Phase 4 sync conflict contracts", () => {
  test("device id is required for bootstrap, changes, and ack", async ({ request }) => {
    const worker = await authPasswordGrant(request, personaCredentials("workerA"));
    await me(request, worker.accessToken);
    const headers = mobileHeaders("ios_worker", { accessToken: worker.accessToken });
    delete headers["x-device-id"];

    const bootstrap = await request.get("/api/v1/sync/bootstrap", { headers });
    expect(bootstrap.status(), "bootstrap missing device").toBe(400);
    const changes = await request.get("/api/v1/sync/changes?cursor=0", { headers });
    expect(changes.status(), "changes missing device").toBe(400);
    const ack = await request.post("/api/v1/sync/ack", { headers, data: { cursor: 0 } });
    expect(ack.status(), "ack missing device").toBe(400);
  });

  test("future cursor returns 409 with recovery cursor alias", async ({ request }) => {
    const fixture = requiredFixture();
    const worker = await authPasswordGrant(request, personaCredentials("workerA"));
    await me(request, worker.accessToken);
    const headers = mobileHeaders("ios_worker", {
      accessToken: worker.accessToken,
      deviceId: `${fixture.deviceA}-future`,
      idempotencyKey: `future-${Date.now()}`,
    });

    const futureAck = await request.post("/api/v1/sync/ack", {
      headers,
      data: { cursor: 9_999_999_999 },
    });
    expect(futureAck.status(), "future ack conflict").toBe(409);
    const conflict = (await futureAck.json()) as ConflictBody;
    expect(conflict.code).toBe("sync_conflict");
    expect(conflict.serverCursor).toBe(conflict.server_cursor);
    expect(typeof conflict.server_cursor).toBe("number");

    const recovery = await request.post("/api/v1/sync/ack", {
      headers: mobileHeaders("ios_worker", {
        accessToken: worker.accessToken,
        deviceId: `${fixture.deviceA}-future`,
        idempotencyKey: `future-recovery-${Date.now()}`,
      }),
      data: { cursor: conflict.server_cursor },
    });
    expect(recovery.status(), "ack recovered at server cursor").toBe(200);
    const recoveryBody = (await recovery.json()) as { ok: true; cursor: number };
    expect(recoveryBody.ok).toBe(true);
    expect(recoveryBody.cursor).toBe(conflict.server_cursor);
  });

  test("invalid ack cursor is rejected before storing cursor", async ({ request }) => {
    const fixture = requiredFixture();
    const worker = await authPasswordGrant(request, personaCredentials("workerA"));
    await me(request, worker.accessToken);
    const res = await request.post("/api/v1/sync/ack", {
      headers: mobileHeaders("android_worker", {
        accessToken: worker.accessToken,
        deviceId: `${fixture.deviceA}-invalid`,
        idempotencyKey: `invalid-${Date.now()}`,
      }),
      data: { cursor: "not-a-number" },
    });
    expect(res.status(), "invalid cursor body").toBe(400);
  });

  test("two devices are independent, no-rewind conflicts, and concurrent ack is stable", async ({ request }) => {
    const fixture = requiredFixture();
    const worker = await authPasswordGrant(request, personaCredentials("workerA"));
    await me(request, worker.accessToken);
    const deviceOne = `${fixture.deviceA}-independent-1`;
    const deviceTwo = `${fixture.deviceA}-independent-2`;

    const future = await request.post("/api/v1/sync/ack", {
      headers: mobileHeaders("ios_worker", {
        accessToken: worker.accessToken,
        deviceId: deviceOne,
        idempotencyKey: `independent-future-${Date.now()}`,
      }),
      data: { cursor: 9_999_999_999 },
    });
    expect(future.status()).toBe(409);
    const conflict = (await future.json()) as ConflictBody;
    const serverCursor = conflict.server_cursor;

    const [ackOne, ackTwo] = await Promise.all([
      request.post("/api/v1/sync/ack", {
        headers: mobileHeaders("ios_worker", {
          accessToken: worker.accessToken,
          deviceId: deviceOne,
          idempotencyKey: `ack-one-${Date.now()}`,
        }),
        data: { cursor: serverCursor },
      }),
      request.post("/api/v1/sync/ack", {
        headers: mobileHeaders("ios_worker", {
          accessToken: worker.accessToken,
          deviceId: deviceTwo,
          idempotencyKey: `ack-two-${Date.now()}`,
        }),
        data: { cursor: serverCursor },
      }),
    ]);
    expect(ackOne.status(), "device one ack").toBe(200);
    expect(ackTwo.status(), "device two ack").toBe(200);

    const rewind = await request.post("/api/v1/sync/ack", {
      headers: mobileHeaders("ios_worker", {
        accessToken: worker.accessToken,
        deviceId: deviceOne,
        idempotencyKey: `rewind-${Date.now()}`,
      }),
      data: { cursor: Math.max(0, serverCursor - 1) },
    });
    if (serverCursor > 0) {
      expect(rewind.status(), "device one no-rewind").toBe(409);
      const rewindBody = (await rewind.json()) as ConflictBody;
      expect(rewindBody.code).toBe("sync_conflict");
      expect(rewindBody.hint).toContain("device_mismatch");
    } else {
      expect(rewind.status(), "zero cursor cannot rewind").toBe(200);
    }

    const concurrentKeyA = `concurrent-a-${Date.now()}`;
    const concurrentKeyB = `concurrent-b-${Date.now()}`;
    const [first, second] = await Promise.all([
      request.post("/api/v1/sync/ack", {
        headers: mobileHeaders("android_worker", {
          accessToken: worker.accessToken,
          deviceId: deviceTwo,
          idempotencyKey: concurrentKeyA,
        }),
        data: { cursor: serverCursor },
      }),
      request.post("/api/v1/sync/ack", {
        headers: mobileHeaders("android_worker", {
          accessToken: worker.accessToken,
          deviceId: deviceTwo,
          idempotencyKey: concurrentKeyB,
        }),
        data: { cursor: serverCursor },
      }),
    ]);
    expect([200, 409]).toContain(first.status());
    expect([200, 409]).toContain(second.status());
    expect([first.status(), second.status()]).toContain(200);
  });
});
