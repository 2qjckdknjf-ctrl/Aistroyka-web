import { describe, expect, it, vi } from "vitest";
import { buildProjectProofPack } from "./proof-pack.service";
import * as projectRepo from "@/lib/domain/projects/project.repository";
import * as summaryRepo from "@/lib/domain/projects/project-summary.repository";
import * as mediaRepo from "@/lib/domain/media/media.repository";
import * as documentRepo from "@/lib/domain/documents/document.repository";
import * as clientRequestRepo from "@/lib/domain/client-requests/client-requests.repository";

vi.mock("@/lib/domain/projects/project.repository", () => ({ getById: vi.fn() }));
vi.mock("@/lib/domain/projects/project-summary.repository", () => ({ getProjectSummary: vi.fn() }));
vi.mock("@/lib/domain/media/media.repository", () => ({ listByProject: vi.fn() }));
vi.mock("@/lib/domain/documents/document.repository", () => ({ listByProject: vi.fn() }));
vi.mock("@/lib/domain/client-requests/client-requests.repository", () => ({ listByProject: vi.fn() }));

function tableResult(data: unknown[]) {
  return {
    select: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
    in: vi.fn().mockReturnThis(),
    limit: vi.fn().mockResolvedValue({ data, error: null }),
  };
}

describe("proof-pack.service", () => {
  it("builds customer-safe proof pack without internal finance", async () => {
    vi.mocked(projectRepo.getById).mockResolvedValue({ id: "p1", name: "Build", tenant_id: "t1" } as never);
    vi.mocked(summaryRepo.getProjectSummary).mockResolvedValue({ tasksDone: 2, tasksTotal: 3 } as never);
    vi.mocked(mediaRepo.listByProject).mockResolvedValue([
      { id: "m1", project_id: "p1", tenant_id: "t1", type: "before", file_url: "https://x/b.jpg", uploaded_at: "2026-01-01" },
    ]);
    vi.mocked(documentRepo.listByProject).mockResolvedValue([
      {
        id: "d1",
        title: "Act",
        type: "act",
        status: "approved",
        client_visible: true,
        object_path: "internal/path",
        updated_at: "2026-01-01",
      },
    ] as never);
    vi.mocked(clientRequestRepo.listByProject).mockResolvedValue([
      { id: "r1", title: "Approve", status: "completed", requested_at: "2026-01-01" },
    ] as never);

    const commercial = tableResult([{ id: "c1", title: "Approved change", amount: 100, currency: "RUB", status: "issued" }]);
    const changes = tableResult([{ id: "co1", title: "Extra work", customer_amount_delta: 200, currency: "RUB", status: "approved" }]);
    const supabase = {
      from: vi.fn((table: string) => (table === "project_commercial_items" ? commercial : changes)),
    } as never;

    const pack = await buildProjectProofPack(supabase, "t1", "p1");
    const json = JSON.stringify(pack);

    expect(pack?.media[0].category).toBe("before");
    expect(json).not.toContain("object_path");
    expect(json).not.toContain("planned_total");
    expect(json).not.toContain("actual_total");
    expect(json).not.toContain("margin");
    expect(json).not.toContain("internal_cost_item");
    expect(pack?.approved_commercial_changes).toHaveLength(2);
  });

  it("public audience omits non-evidence and internal-tagged media", async () => {
    vi.mocked(projectRepo.getById).mockResolvedValue({ id: "p1", name: "Build", tenant_id: "t1" } as never);
    vi.mocked(summaryRepo.getProjectSummary).mockResolvedValue({ tasksDone: 0, tasksTotal: 1 } as never);
    vi.mocked(mediaRepo.listByProject).mockResolvedValue([
      { id: "m1", project_id: "p1", tenant_id: "t1", type: "before", file_url: "https://x/a.jpg", uploaded_at: "2026-01-01" },
      { id: "m2", project_id: "p1", tenant_id: "t1", type: "internal_notes_photo", file_url: "https://x/b.jpg", uploaded_at: "2026-01-02" },
      { id: "m3", project_id: "p1", tenant_id: "t1", type: "payroll_scan", file_url: "https://x/c.jpg", uploaded_at: "2026-01-03" },
    ]);
    vi.mocked(documentRepo.listByProject).mockResolvedValue([]);
    vi.mocked(clientRequestRepo.listByProject).mockResolvedValue([]);
    const commercial = tableResult([]);
    const changes = tableResult([]);
    const supabase = {
      from: vi.fn((table: string) => (table === "project_commercial_items" ? commercial : changes)),
    } as never;

    const pack = await buildProjectProofPack(supabase, "t1", "p1", { audience: "public" });
    expect(pack?.media.map((x) => x.id)).toEqual(["m1"]);
  });
});
