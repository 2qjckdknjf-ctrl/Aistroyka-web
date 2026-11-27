import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it, vi } from "vitest";
import { createHeuristicExtractionRun } from "./preproject-extraction.service";

const TENANT = "11111111-1111-4111-8111-111111111111";
const PROJECT = "22222222-2222-4222-8222-222222222222";
const DRAFT = "33333333-3333-4333-8333-333333333333";
const observation = {
  id: "obs-1", run_id: "run-1", kind: "room", label: "Kitchen", payload: {},
  uncertainty: "medium", source_coords: { field: "text", match: "kitchen" }, review_status: "pending",
  reviewed_by: null, reviewed_at: null, review_note: null, created_at: "2026-10-30T00:00:00.000Z",
};
function fixture(reused = true, intakeDraftId: string | null = DRAFT) {
  const run = {
    id: "run-1", tenant_id: TENANT, project_id: PROJECT, intake_draft_id: intakeDraftId,
    status: "pending_review", source_kind: "text_heuristic", source_ref: "text_heuristic.v1",
    created_at: "2026-10-30T00:00:00.000Z", provider_meta: { observation_count: 1 }, observations: [observation],
  };
  const rpc = vi.fn().mockResolvedValue({ data: { run, reused }, error: null });
  const from = vi.fn((table: string) => {
    const result = { data: table === "customer_intake_drafts" ? {
      id: DRAFT, title: "Kitchen", description: "painting", status: "submitted", project_id: PROJECT, updated_at: "2026-10-30T00:00:00.000Z",
    } : null, error: null };
    const query = { select: () => query, eq: () => query, maybeSingle: async () => result };
    return query;
  });
  return { client: { from, rpc } as never, from, rpc, run };
}
const input = { tenantId: TENANT, actorUserId: "user-1", projectId: PROJECT, intakeDraftId: DRAFT, text: "Kitchen painting" };

describe("AIS-CLIENT-005A atomic extraction", () => {
  it("reuses a complete run through the transaction rather than separate inserts", async () => {
    const db = fixture();
    const result = await createHeuristicExtractionRun(db.client, input);
    expect(result).toMatchObject({ ok: true, reused: true, run: { id: "run-1", observations: [observation] } });
    expect(db.rpc).toHaveBeenCalledWith("create_preproject_extraction_atomic", expect.objectContaining({
      p_tenant_id: TENANT, p_project_id: PROJECT, p_actor_user_id: "user-1", p_intake_draft_id: DRAFT,
      p_input_hash: createHash("sha256").update(input.text).digest("hex"),
    }));
    expect(db.rpc.mock.calls[0][1].p_observations.length).toBeGreaterThan(0);
  });

  it("fails closed when intake_draft_id is unknown", async () => {
    const db = fixture();
    db.from.mockImplementation(() => {
      const query = { select: () => query, eq: () => query, maybeSingle: async () => ({ data: null, error: null }) };
      return query;
    });
    expect(await createHeuristicExtractionRun(db.client, input)).toMatchObject({ ok: false, code: "DRAFT_NOT_FOUND" });
    expect(db.rpc).not.toHaveBeenCalled();
  });

  it("creates a new complete run without an intake draft", async () => {
    const db = fixture(false, null);
    const result = await createHeuristicExtractionRun(db.client, { ...input, intakeDraftId: null });
    expect(result).toMatchObject({ ok: true, run: { intake_draft_id: null, observations: [observation] } });
    if (result.ok) expect(result.reused).toBeUndefined();
    expect(db.from).not.toHaveBeenCalled();
  });

  it.each(["RUN_INCOMPLETE", "DRAFT_PROJECT_MISMATCH", "DRAFT_INPUT_MISMATCH"])("preserves transaction rejection %s without reporting reuse", async (message) => {
    const db = fixture(); db.rpc.mockResolvedValue({ data: null, error: { code: "P0001", message } });
    expect(await createHeuristicExtractionRun(db.client, input)).toMatchObject({ ok: false, code: message });
  });

  it("does not silently fall back to non-atomic writes before migration rollout", async () => {
    const db = fixture(); db.rpc.mockResolvedValue({ data: null, error: { code: "PGRST202", message: "missing function" } });
    expect(await createHeuristicExtractionRun(db.client, input)).toMatchObject({ ok: false, code: "PERSISTENCE_UNAVAILABLE" });
    expect(db.rpc).toHaveBeenCalledTimes(1);
  });

  it.each(["missing observations", "wrong project", "wrong run"])("rejects an incomplete or misbound transaction response: %s", async (failure) => {
    const db = fixture();
    if (failure === "missing observations") db.run.observations = [];
    if (failure === "wrong project") db.run.project_id = "another-project";
    if (failure === "wrong run") db.run.observations = [{ ...observation, run_id: "different-run" }];
    expect(await createHeuristicExtractionRun(db.client, input)).toMatchObject({ ok: false, code: "RUN_INCOMPLETE" });
  });

  it("retains the unique intake-draft constraint", () => {
    const sql = readFileSync(join(process.cwd(), "supabase/migrations/20261030230000_ais_client_005a_intake_draft_idempotency.sql"), "utf8");
    expect(sql).toContain("preproject_extraction_runs_intake_draft_uidx");
    expect(sql).toContain("where intake_draft_id is not null");
  });
});
