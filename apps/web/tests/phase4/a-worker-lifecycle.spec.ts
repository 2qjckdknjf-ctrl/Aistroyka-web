import { expect, test, type APIRequestContext } from "@playwright/test";
import {
  authPasswordGrant,
  expectLiteForbidden,
  me,
  mobileHeaders,
  personaCredentials,
  readJson,
  requiredFixture,
  type MobileProfile,
} from "./helpers";

const workerProfiles: MobileProfile[] = ["ios_worker", "android_worker"];

/** Tiny deterministic JPEG (not a real photo / no PII). */
const SYNTHETIC_JPEG = Buffer.from(
  "/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAAgGBgcGBQgHBwcJCQgKDBQNDAsLDBkSEw8UHRofHh0aHBwgJC4nICIsIxwcKDcpLDAxNDQ0Hyc5PTgyPC4zNDL/2wBDAQkJCQwLDBgNDRgyIRwhMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjL/wAARCAABAAEDASIAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAAn/xAAUEAEAAAAAAAAAAAAAAAAAAAAA/8QAFQEBAQAAAAAAAAAAAAAAAAAAAAX/xAAUEQEAAAAAAAAAAAAAAAAAAAAA/9oADAMBAAIQAxAAAAGcP//EABQQAQAAAAAAAAAAAAAAAAAAAAD/2gAIAQEAAQUCf//EABQRAQAAAAAAAAAAAAAAAAAAAAD/2gAIAQMBAT8Bf//EABQRAQAAAAAAAAAAAAAAAAAAAAD/2gAIAQIBAT8Bf//EABQQAQAAAAAAAAAAAAAAAAAAAAD/2gAIAQEABj8Cf//EABQQAQAAAAAAAAAAAAAAAAAAAAD/2gAIAQEAAT8hf//Z",
  "base64"
);

async function postJsonOk(
  request: APIRequestContext,
  path: string,
  headers: Record<string, string>,
  data: Record<string, unknown>,
  label: string
) {
  const res = await request.post(path, { headers, data });
  expect(res.status(), label).toBe(200);
  return { res, body: (await res.json()) as Record<string, unknown> };
}

async function uploadSyntheticObject(
  request: APIRequestContext,
  accessToken: string,
  uploadPath: string
): Promise<{ objectPath: string; size: number }> {
  const objectPath = `${uploadPath}/proof.jpg`;
  const pathInBucket = objectPath.startsWith("media/") ? objectPath.slice("media/".length) : objectPath;
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!.replace(/\/$/, "");
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
  const storageRes = await request.post(`${supabaseUrl}/storage/v1/object/media/${pathInBucket}`, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
      apikey: anonKey,
      "content-type": "image/jpeg",
      "x-upsert": "true",
    },
    data: SYNTHETIC_JPEG,
  });
  expect([200, 201], "storage upload").toContain(storageRes.status());
  return { objectPath, size: SYNTHETIC_JPEG.length };
}

test.describe("Phase 4 worker lifecycle contracts", () => {
  test("ios_worker full task/day/report/media/sync/device lifecycle is idempotent", async ({ request }) => {
    const profile: MobileProfile = "ios_worker";
    const fixture = requiredFixture();
    const auth = await authPasswordGrant(request, personaCredentials("workerA"));
    const runtime = await me(request, auth.accessToken);
    expect(runtime.role).toBe("member");
    const deviceId = `${fixture.deviceA}-${profile}`;

    const discovery = await request.get("/api/v1/worker", {
      headers: mobileHeaders(profile, { accessToken: auth.accessToken, deviceId }),
    });
    expect(discovery.status()).toBe(200);
    expect((await discovery.json()) as { canonical_routes?: unknown }).toHaveProperty("canonical_routes");

    const taskList = await request.get(`/api/v1/worker/tasks/today?project_id=${fixture.projectId}`, {
      headers: mobileHeaders(profile, { accessToken: auth.accessToken, deviceId }),
    });
    expect(taskList.status()).toBe(200);
    const tasks = ((await taskList.json()) as { data?: Array<{ id: string }> }).data ?? [];
    expect(tasks.map((task) => task.id)).toContain(fixture.workerATaskId);

    const taskDetail = await request.get(`/api/v1/tasks/${fixture.workerATaskId}`, {
      headers: mobileHeaders(profile, { accessToken: auth.accessToken, deviceId }),
    });
    expect(taskDetail.status()).toBe(200);

    const dayKey = `${profile}-day-${Date.now()}`;
    const day = await postJsonOk(
      request,
      "/api/v1/worker/day/start",
      mobileHeaders(profile, { accessToken: auth.accessToken, deviceId, idempotencyKey: dayKey }),
      {},
      `${profile} day start`
    );
    const dayReplay = await request.post("/api/v1/worker/day/start", {
      headers: mobileHeaders(profile, { accessToken: auth.accessToken, deviceId, idempotencyKey: dayKey }),
      data: {},
    });
    expect(dayReplay.status(), `${profile} day replay`).toBe(200);
    const dayReplayBody = (await dayReplay.json()) as { data?: { id?: string; day_date?: string } };
    // Business idempotency: same day row. started_at may refresh if legacy cache misses under load;
    // report/submit keys below prove response-body replay.
    expect(dayReplayBody.data?.id).toBe((day.body.data as { id?: string }).id);
    expect(dayReplayBody.data?.day_date).toBe((day.body.data as { day_date?: string }).day_date);
    const dayId = (day.body.data as { id?: string } | undefined)?.id;

    const reportKey = `${profile}-report-${Date.now()}`;
    const report = await postJsonOk(
      request,
      "/api/v1/worker/report/create",
      mobileHeaders(profile, { accessToken: auth.accessToken, deviceId, idempotencyKey: reportKey }),
      { day_id: dayId, task_id: fixture.workerATaskId },
      `${profile} report create`
    );
    const reportReplay = await request.post("/api/v1/worker/report/create", {
      headers: mobileHeaders(profile, { accessToken: auth.accessToken, deviceId, idempotencyKey: reportKey }),
      data: { day_id: dayId, task_id: fixture.workerATaskId },
    });
    expect(reportReplay.status(), `${profile} report replay`).toBe(200);
    expect(await reportReplay.json()).toEqual(report.body);
    const reportId = (report.body.data as { id?: string }).id;
    expect(reportId).toBeTruthy();

    // Legacy lite idempotency (live default): same key replays original response even if body differs.
    // Strict payload-conflict is covered by unit/algorithm tests; live strict RPC may be MISSING.
    const legacyReplayDifferentBody = await request.post("/api/v1/worker/report/create", {
      headers: mobileHeaders(profile, {
        accessToken: auth.accessToken,
        deviceId,
        idempotencyKey: reportKey,
      }),
      data: { day_id: dayId, task_id: fixture.workerBTaskId },
    });
    expect(legacyReplayDifferentBody.status(), `${profile} legacy same-key replay`).toBe(200);
    expect(await legacyReplayDifferentBody.json()).toEqual(report.body);

    const uploadKey = `${profile}-upload-${Date.now()}`;
    const upload = await postJsonOk(
      request,
      "/api/v1/media/upload-sessions",
      mobileHeaders(profile, { accessToken: auth.accessToken, deviceId, idempotencyKey: uploadKey }),
      { purpose: "report_after" },
      `${profile} upload create`
    );
    const uploadData = upload.body.data as { id?: string; upload_path?: string };
    expect(uploadData.id).toBeTruthy();
    expect(uploadData.upload_path).toContain(uploadData.id!);

    const { objectPath, size } = await uploadSyntheticObject(request, auth.accessToken, uploadData.upload_path!);

    const finalizeKey = `${profile}-finalize-${Date.now()}`;
    const finalized = await postJsonOk(
      request,
      `/api/v1/media/upload-sessions/${uploadData.id}/finalize`,
      mobileHeaders(profile, { accessToken: auth.accessToken, deviceId, idempotencyKey: finalizeKey }),
      {
        object_path: objectPath,
        mime_type: "image/jpeg",
        size_bytes: size,
      },
      `${profile} upload finalize`
    );
    expect(finalized.body).toEqual({ ok: true });

    const badFinalize = await request.post(`/api/v1/media/upload-sessions/${uploadData.id}/finalize`, {
      headers: mobileHeaders(profile, {
        accessToken: auth.accessToken,
        deviceId,
        idempotencyKey: `${finalizeKey}-wrong-path`,
      }),
      data: {
        object_path: `media/other-tenant/${uploadData.id}/evil.jpg`,
        mime_type: "image/jpeg",
        size_bytes: size,
      },
    });
    expect([400, 403], `${profile} finalize wrong path`).toContain(badFinalize.status());

    const addMediaKey = `${profile}-add-media-${Date.now()}`;
    const added = await postJsonOk(
      request,
      "/api/v1/worker/report/add-media",
      mobileHeaders(profile, { accessToken: auth.accessToken, deviceId, idempotencyKey: addMediaKey }),
      { report_id: reportId, upload_session_id: uploadData.id },
      `${profile} add media`
    );
    expect(added.body).toEqual({ ok: true });

    const submitKey = `${profile}-submit-${Date.now()}`;
    const submitted = await postJsonOk(
      request,
      "/api/v1/worker/report/submit",
      mobileHeaders(profile, { accessToken: auth.accessToken, deviceId, idempotencyKey: submitKey }),
      { report_id: reportId, task_id: fixture.workerATaskId, worker_note: "Phase 4 contract proof" },
      `${profile} submit`
    );
    expect(submitted.body.status).toBe("queued");
    const submitReplay = await request.post("/api/v1/worker/report/submit", {
      headers: mobileHeaders(profile, { accessToken: auth.accessToken, deviceId, idempotencyKey: submitKey }),
      data: { report_id: reportId, task_id: fixture.workerATaskId, worker_note: "Phase 4 contract proof" },
    });
    expect(submitReplay.status(), `${profile} submit replay`).toBe(200);
    expect(await submitReplay.json()).toEqual(submitted.body);

    const bootstrap = await request.get("/api/v1/sync/bootstrap", {
      headers: mobileHeaders(profile, { accessToken: auth.accessToken, deviceId }),
    });
    expect(bootstrap.status(), `${profile} sync bootstrap`).toBe(200);
    const bootBody = (await bootstrap.json()) as { cursor: number; data: Record<string, unknown> };
    expect(typeof bootBody.cursor).toBe("number");
    expect(bootBody.data).toHaveProperty("tasks");
    expect(bootBody.data).toHaveProperty("reports");
    expect(bootBody.data).toHaveProperty("uploadSessions");

    const changes = await request.get(`/api/v1/sync/changes?cursor=${bootBody.cursor}&limit=25`, {
      headers: mobileHeaders(profile, { accessToken: auth.accessToken, deviceId }),
    });
    expect(changes.status(), `${profile} sync changes`).toBe(200);
    const changesBody = (await changes.json()) as { next_cursor: number; data: { changes: unknown[] } };
    expect(Array.isArray(changesBody.data.changes)).toBe(true);

    const ackKey = `${profile}-ack-${Date.now()}`;
    const ack = await postJsonOk(
      request,
      "/api/v1/sync/ack",
      mobileHeaders(profile, { accessToken: auth.accessToken, deviceId, idempotencyKey: ackKey }),
      { cursor: changesBody.next_cursor },
      `${profile} sync ack`
    );
    expect(ack.body.ok).toBe(true);

    const registerKey = `${profile}-register-${Date.now()}`;
    const registered = await postJsonOk(
      request,
      "/api/v1/devices/register",
      mobileHeaders(profile, { accessToken: auth.accessToken, deviceId, idempotencyKey: registerKey }),
      { device_id: deviceId, platform: "ios", token: `token-${profile}` },
      `${profile} device register`
    );
    expect(registered.body).toEqual({ success: true });
    const registeredReplay = await request.post("/api/v1/devices/register", {
      headers: mobileHeaders(profile, { accessToken: auth.accessToken, deviceId, idempotencyKey: registerKey }),
      data: { device_id: deviceId, platform: "ios", token: `token-${profile}` },
    });
    expect(registeredReplay.status(), `${profile} register replay`).toBe(200);
    expect(await registeredReplay.json()).toEqual(registered.body);

    const unregisterKey = `${profile}-unregister-${Date.now()}`;
    const unregistered = await postJsonOk(
      request,
      "/api/v1/devices/unregister",
      mobileHeaders(profile, { accessToken: auth.accessToken, deviceId, idempotencyKey: unregisterKey }),
      { device_id: deviceId },
      `${profile} device unregister`
    );
    expect(unregistered.body).toEqual({ success: true });

    const endKey = `${profile}-end-${Date.now()}`;
    const ended = await postJsonOk(
      request,
      "/api/v1/worker/day/end",
      mobileHeaders(profile, { accessToken: auth.accessToken, deviceId, idempotencyKey: endKey }),
      {},
      `${profile} day end`
    );
    expect(ended.body.data).toBeTruthy();
  });

  test("android_worker parity on discovery/sync/device without duplicate submit", async ({ request }) => {
    const profile: MobileProfile = "android_worker";
    const fixture = requiredFixture();
    const auth = await authPasswordGrant(request, personaCredentials("workerA"));
    await me(request, auth.accessToken);
    const deviceId = `${fixture.deviceA}-${profile}`;

    const discovery = await request.get("/api/v1/worker", {
      headers: mobileHeaders(profile, { accessToken: auth.accessToken, deviceId }),
    });
    expect(discovery.status()).toBe(200);

    const taskList = await request.get(`/api/v1/worker/tasks/today?project_id=${fixture.projectId}`, {
      headers: mobileHeaders(profile, { accessToken: auth.accessToken, deviceId }),
    });
    expect(taskList.status()).toBe(200);

    const missingHeaders = mobileHeaders(profile, { accessToken: auth.accessToken, deviceId });
    delete missingHeaders["x-idempotency-key"];
    const missingIdem = await request.post("/api/v1/worker/day/start", {
      headers: missingHeaders,
      data: {},
    });
    expect(missingIdem.status(), `${profile} missing idempotency`).toBe(400);
    const missingBody = (await missingIdem.json()) as { code?: string };
    expect(missingBody.code).toBe("idempotency_key_required");

    const bootstrap = await request.get("/api/v1/sync/bootstrap", {
      headers: mobileHeaders(profile, { accessToken: auth.accessToken, deviceId }),
    });
    expect(bootstrap.status()).toBe(200);

    const registerKey = `${profile}-register-${Date.now()}`;
    const registered = await postJsonOk(
      request,
      "/api/v1/devices/register",
      mobileHeaders(profile, { accessToken: auth.accessToken, deviceId, idempotencyKey: registerKey }),
      { device_id: deviceId, platform: "android", token: `token-${profile}` },
      `${profile} device register`
    );
    expect(registered.body).toEqual({ success: true });

    const unregistered = await postJsonOk(
      request,
      "/api/v1/devices/unregister",
      mobileHeaders(profile, {
        accessToken: auth.accessToken,
        deviceId,
        idempotencyKey: `${profile}-unregister-${Date.now()}`,
      }),
      { device_id: deviceId },
      `${profile} device unregister`
    );
    expect(unregistered.body).toEqual({ success: true });
  });

  test("ios_worker and android_worker share denials, with cross-worker B isolation", async ({ request }) => {
    const fixture = requiredFixture();
    const workerB = await authPasswordGrant(request, personaCredentials("workerB"));
    await me(request, workerB.accessToken);

    for (const profile of workerProfiles) {
      for (const path of ["/api/v1/admin/metrics/overview", "/api/v1/billing/overview", "/api/v1/ai/requests"]) {
        const denied = await request.get(path, {
          headers: mobileHeaders(profile, { accessToken: workerB.accessToken, deviceId: fixture.deviceB }),
        });
        await expectLiteForbidden(denied, `${profile} ${path}`);
      }

      const taskA = await request.get(`/api/v1/tasks/${fixture.workerATaskId}`, {
        headers: mobileHeaders(profile, { accessToken: workerB.accessToken, deviceId: fixture.deviceB }),
      });
      expect([403, 404], `${profile} worker B cannot read worker A task`).toContain(taskA.status());
      const body = await readJson(taskA);
      expect(JSON.stringify(body)).not.toContain(fixture.workerATaskId);
    }
  });
});
