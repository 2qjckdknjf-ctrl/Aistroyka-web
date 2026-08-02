import { expect, test } from "@playwright/test";
import {
  authPasswordGrant,
  me,
  mobileHeaders,
  personaCredentials,
  requiredFixture,
  type MobileProfile,
} from "./helpers";

const managerProfiles: MobileProfile[] = ["ios_manager", "android_manager"];

test.describe("Phase 4 manager review contracts", () => {
  test("ios_manager and android_manager can discover, read, and review a submitted report", async ({
    request,
  }) => {
    const fixture = requiredFixture();
    const manager = await authPasswordGrant(request, personaCredentials("manager"));
    const managerMe = await me(request, manager.accessToken);
    expect(managerMe.role).toBe("member");

    // Discover an existing submitted report from worker lifecycle (serial workers=1), else seed once.
    let reportId = "";
    {
      const probeHeaders = mobileHeaders("ios_manager", {
        accessToken: manager.accessToken,
        deviceId: `${fixture.deviceA}-mgr-probe`,
      });
      const listed = await request.get(`/api/v1/reports?project_id=${fixture.projectId}&limit=50`, {
        headers: probeHeaders,
      });
      if (listed.status() === 200) {
        const rows =
          ((await listed.json()) as { data?: Array<{ id: string; status?: string }> }).data ?? [];
        reportId = rows.find((row) => row.status === "submitted" || row.status === "changes_requested")?.id ?? "";
      }
    }
    if (!reportId) {
      const worker = await authPasswordGrant(request, personaCredentials("workerA"));
      const deviceId = `${fixture.deviceA}-manager-seed`;
      const wh = (key: string) =>
        mobileHeaders("ios_worker", {
          accessToken: worker.accessToken,
          deviceId,
          idempotencyKey: `mgr-seed-${key}-${Date.now()}`,
        });
      await request.post("/api/v1/worker/day/start", { headers: wh("day"), data: {} });
      const reportRes = await request.post("/api/v1/worker/report/create", {
        headers: wh("report"),
        data: { task_id: fixture.workerATaskId },
      });
      expect(reportRes.status()).toBe(200);
      reportId = ((await reportRes.json()) as { data: { id: string } }).data.id;
      const uploadRes = await request.post("/api/v1/media/upload-sessions", {
        headers: wh("upload"),
        data: { purpose: "report_after" },
      });
      expect(uploadRes.status()).toBe(200);
      const upload = ((await uploadRes.json()) as { data: { id: string; upload_path: string } }).data;
      const objectPath = `${upload.upload_path}/manager-seed.jpg`;
      const pathInBucket = objectPath.slice("media/".length);
      const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!.replace(/\/$/, "");
      await request.post(`${supabaseUrl}/storage/v1/object/media/${pathInBucket}`, {
        headers: {
          Authorization: `Bearer ${worker.accessToken}`,
          apikey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
          "content-type": "image/jpeg",
          "x-upsert": "true",
        },
        data: Buffer.from([0xff, 0xd8, 0xff, 0xd9]),
      });
      expect(
        (
          await request.post(`/api/v1/media/upload-sessions/${upload.id}/finalize`, {
            headers: wh("finalize"),
            data: { object_path: objectPath, mime_type: "image/jpeg", size_bytes: 4 },
          })
        ).status()
      ).toBe(200);
      expect(
        (
          await request.post("/api/v1/worker/report/add-media", {
            headers: wh("add-media"),
            data: { report_id: reportId, upload_session_id: upload.id },
          })
        ).status()
      ).toBe(200);
      expect(
        (
          await request.post("/api/v1/worker/report/submit", {
            headers: wh("submit"),
            data: { report_id: reportId, task_id: fixture.workerATaskId, worker_note: "manager seed" },
          })
        ).status()
      ).toBe(200);
    }

    let reviewStatus: string | null = null;
    for (const profile of managerProfiles) {
      const headers = mobileHeaders(profile, {
        accessToken: manager.accessToken,
        deviceId: `${fixture.deviceA}-${profile}-review`,
      });

      const meRes = await request.get("/api/v1/me", { headers });
      expect(meRes.status(), `${profile} me`).toBe(200);

      const projects = await request.get("/api/v1/projects", { headers });
      expect(projects.status(), `${profile} projects`).toBe(200);

      const ops = await request.get(`/api/v1/ops/overview?limit=10&project_id=${fixture.projectId}`, {
        headers,
      });
      expect(ops.status(), `${profile} ops/overview`).toBe(200);

      const workers = await request.get("/api/v1/workers?limit=20", { headers });
      expect(workers.status(), `${profile} workers`).toBe(200);

      const reports = await request.get(`/api/v1/reports?project_id=${fixture.projectId}&limit=20`, {
        headers,
      });
      expect(reports.status(), `${profile} reports list`).toBe(200);
      const reportRows = ((await reports.json()) as { data?: Array<{ id: string }> }).data ?? [];
      expect(reportRows.map((row) => row.id)).toContain(reportId);

      const report = await request.get(`/api/v1/reports/${reportId}`, { headers });
      expect(report.status(), `${profile} report read`).toBe(200);
      const reportBody = (await report.json()) as { data?: { id?: string; status?: string } };
      expect(reportBody.data?.id).toBe(reportId);

      if (reviewStatus === null) {
        const review = await request.patch(`/api/v1/reports/${reportId}`, {
          headers,
          data: { status: "changes_requested", manager_note: `${profile} review proof` },
        });
        expect(review.status(), `${profile} report review`).toBe(200);
        const reviewBody = (await review.json()) as {
          data?: { status?: string; manager_note?: string | null };
        };
        expect(reviewBody.data?.status).toBe("changes_requested");
        expect(reviewBody.data?.manager_note).toContain(profile);
        reviewStatus = "changes_requested";
      } else {
        // Second manager profile: read-only confirmation of reviewed state (avoid double-transition flake).
        expect(reportBody.data?.status).toBe("changes_requested");
      }
    }
  });
});
