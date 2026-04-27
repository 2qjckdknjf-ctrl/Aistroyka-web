import { describe, it, expect, vi, beforeEach } from "vitest";
import type { SupabaseClient } from "@supabase/supabase-js";
import {
  createClientRequest,
  respondToClientRequest,
  patchClientRequestByManager,
  rowToPublic,
} from "./client-requests.service";
import type { ProjectClientRequestRow } from "./client-requests.types";

vi.mock("./client-requests.policy", () => ({
  canManageClientRequests: vi.fn(),
  canStakeholderAccessClientRequests: vi.fn(),
  canRespondToClientRequests: vi.fn(),
}));
vi.mock("@/lib/domain/documents/document.repository", () => ({
  getById: vi.fn(),
}));
vi.mock("@/lib/domain/milestones/milestone.repository", () => ({
  getById: vi.fn(),
}));
vi.mock("./client-requests.repository", () => ({
  insertRequest: vi.fn(),
  insertEvent: vi.fn(),
  getById: vi.fn(),
  updateRequest: vi.fn(),
  listByProject: vi.fn(),
  listEventsByRequest: vi.fn(),
}));

const policy = await import("./client-requests.policy");
const docRepo = await import("@/lib/domain/documents/document.repository");
const repo = await import("./client-requests.repository");

const supabase = {} as SupabaseClient;
const ctx = { tenantId: "t1", userId: "u1", role: "owner" as const };

function baseRow(over: Partial<ProjectClientRequestRow> = {}): ProjectClientRequestRow {
  return {
    id: "req1",
    tenant_id: "t1",
    project_id: "p1",
    kind: "approve_or_reject",
    action_mode: "action_required",
    status: "open",
    title: "T",
    instructions: null,
    choice_options: null,
    linked_entity_type: null,
    linked_entity_id: null,
    requested_by: "mgr",
    requested_at: "2026-01-01",
    responded_at: null,
    responded_by: null,
    response_value: null,
    response_note: null,
    cancelled_at: null,
    cancelled_by: null,
    completed_at: null,
    completed_by: null,
    created_at: "2026-01-01",
    updated_at: "2026-01-01",
    ...over,
  };
}

describe("client-requests.service", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("createClientRequest rejects invalid kind", async () => {
    vi.mocked(policy.canManageClientRequests).mockResolvedValue(true);
    const { data, error } = await createClientRequest(supabase, ctx, "p1", {
      kind: "invalid" as any,
      title: "x",
    });
    expect(data).toBeNull();
    expect(error).toBe("Invalid kind");
  });

  it("createClientRequest validates choice options", async () => {
    vi.mocked(policy.canManageClientRequests).mockResolvedValue(true);
    const { data, error } = await createClientRequest(supabase, ctx, "p1", {
      kind: "choice",
      title: "Pick",
      choice_options: ["a"],
    });
    expect(data).toBeNull();
    expect(error).toBe("choice requires at least two options");
  });

  it("createClientRequest inserts and logs event", async () => {
    vi.mocked(policy.canManageClientRequests).mockResolvedValue(true);
    vi.mocked(docRepo.getById).mockResolvedValue(null);
    vi.mocked(repo.insertRequest).mockResolvedValue(baseRow({ kind: "feedback", title: "Need text" }));
    vi.mocked(repo.insertEvent).mockResolvedValue({} as any);

    const { data, error } = await createClientRequest(supabase, ctx, "p1", {
      kind: "feedback",
      title: "Need text",
    });
    expect(error).toBe("");
    expect(data?.title).toBe("Need text");
    expect(repo.insertEvent).toHaveBeenCalled();
  });

  it("respondToClientRequest sets status responded", async () => {
    vi.mocked(policy.canRespondToClientRequests).mockResolvedValue(true);
    vi.mocked(repo.getById).mockResolvedValue(baseRow({ kind: "approve_or_reject" }));
    vi.mocked(repo.updateRequest).mockImplementation(async () =>
      baseRow({ status: "responded", response_value: "approve" })
    );
    vi.mocked(repo.insertEvent).mockResolvedValue({} as any);

    const { data, error } = await respondToClientRequest(supabase, ctx, "p1", "req1", {
      decision: "approve",
    });
    expect(error).toBe("");
    expect(data?.status).toBe("responded");
  });

  it("respondToClientRequest rejects info_only", async () => {
    vi.mocked(policy.canRespondToClientRequests).mockResolvedValue(true);
    vi.mocked(repo.getById).mockResolvedValue(baseRow({ action_mode: "info_only" }));

    const { data, error } = await respondToClientRequest(supabase, ctx, "p1", "req1", {
      decision: "approve",
    });
    expect(data).toBeNull();
    expect(error).toContain("does not require");
  });

  it("patchClientRequestByManager completes after respond", async () => {
    vi.mocked(policy.canManageClientRequests).mockResolvedValue(true);
    vi.mocked(repo.getById).mockResolvedValue(baseRow({ status: "responded", action_mode: "action_required" }));
    vi.mocked(repo.updateRequest).mockImplementation(async () =>
      baseRow({ status: "completed", completed_at: "2026-01-02", completed_by: "mgr" })
    );
    vi.mocked(repo.insertEvent).mockResolvedValue({} as any);

    const { data, error } = await patchClientRequestByManager(supabase, ctx, "p1", "req1", {
      status: "completed",
    });
    expect(error).toBe("");
    expect(data?.status).toBe("completed");
  });

  it("rowToPublic strips internal ids from customer view", () => {
    const r = baseRow();
    const pub = rowToPublic(r);
    expect(pub).not.toHaveProperty("requested_by");
    expect(pub.id).toBe("req1");
  });
});
