import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it, vi } from "vitest";
import { createHeuristicExtractionRun } from "./preproject-extraction.service";

function chainMock(result: { data: unknown; error: unknown }) {
  const terminal = {
    maybeSingle: vi.fn().mockResolvedValue(result),
    then: undefined as unknown,
  };
  const builder: Record<string, unknown> = {
    select: vi.fn(() => builder),
    eq: vi.fn(() => builder),
    order: vi.fn(() => builder),
    limit: vi.fn(() => builder),
    insert: vi.fn(() => builder),
    maybeSingle: terminal.maybeSingle,
  };
  // Support .insert().select() returning a thenable array result for observations.
  builder.select = vi.fn((cols?: string) => {
    void cols;
    return {
      ...builder,
      maybeSingle: terminal.maybeSingle,
      then: (resolve: (v: unknown) => unknown) =>
        Promise.resolve(result).then(resolve),
    };
  });
  return builder;
}

describe("AIS-CLIENT-005A createHeuristicExtractionRun idempotency", () => {
  it("reuses existing run for the same intake_draft_id without inserting", async () => {
    const existingRun = {
      id: "run-1",
      tenant_id: "tenant-1",
      project_id: "project-1",
      intake_draft_id: "draft-1",
      status: "pending_review",
      source_kind: "text_heuristic",
      source_ref: "text_heuristic.v1",
      created_at: "2026-10-30T00:00:00.000Z",
    };
    const existingObs = [
      {
        id: "obs-1",
        run_id: "run-1",
        kind: "room",
        label: "Kitchen",
        payload: {},
        uncertainty: "medium",
        source_coords: { field: "text", match: "kitchen" },
        review_status: "pending",
        reviewed_by: null,
        reviewed_at: null,
        review_note: null,
        created_at: "2026-10-30T00:00:00.000Z",
      },
    ];

    let fromCalls = 0;
    const insertSpy = vi.fn();
    const supabase = {
      from: vi.fn((table: string) => {
        fromCalls += 1;
        if (table === "preproject_extraction_runs" && fromCalls === 1) {
          const builder = chainMock({ data: existingRun, error: null });
          builder.insert = insertSpy;
          return builder;
        }
        if (table === "preproject_observations") {
          return {
            select: vi.fn(() => ({
              eq: vi.fn(() => ({
                eq: vi.fn(() => ({
                  order: vi.fn().mockResolvedValue({ data: existingObs, error: null }),
                })),
              })),
            })),
          };
        }
        return chainMock({ data: null, error: null });
      }),
    };

    const result = await createHeuristicExtractionRun(supabase as never, {
      tenantId: "tenant-1",
      actorUserId: "user-1",
      projectId: "project-1",
      intakeDraftId: "draft-1",
      text: "Kitchen painting",
    });

    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.reused).toBe(true);
    expect(result.run.id).toBe("run-1");
    expect(result.run.observations).toHaveLength(1);
    expect(insertSpy).not.toHaveBeenCalled();
  });

  it("completes an existing intake-draft run that has no observations", async () => {
    const existingRun = {
      id: "run-incomplete",
      tenant_id: "tenant-1",
      project_id: "project-1",
      intake_draft_id: "draft-1",
      status: "pending_review",
      source_kind: "text_heuristic",
      source_ref: "text_heuristic.v1",
      created_at: "2026-10-30T00:00:00.000Z",
    };
    const insertedObs = [
      {
        id: "obs-repaired",
        run_id: "run-incomplete",
        kind: "room",
        label: "Kitchen",
        payload: {},
        uncertainty: "medium",
        source_coords: { field: "text", match: "kitchen" },
        review_status: "pending",
        reviewed_by: null,
        reviewed_at: null,
        review_note: null,
        created_at: "2026-10-30T00:00:00.000Z",
      },
    ];

    const runInsertSpy = vi.fn();
    const obsInsertSpy = vi.fn(() => ({
      select: vi.fn().mockResolvedValue({ data: insertedObs, error: null }),
    }));
    let obsReads = 0;
    const supabase = {
      from: vi.fn((table: string) => {
        if (table === "preproject_extraction_runs") {
          const builder = chainMock({ data: existingRun, error: null });
          builder.insert = runInsertSpy;
          return builder;
        }
        obsReads += 1;
        if (obsReads === 1) {
          return {
            select: vi.fn(() => ({
              eq: vi.fn(() => ({
                eq: vi.fn(() => ({
                  order: vi.fn().mockResolvedValue({ data: [], error: null }),
                })),
              })),
            })),
          };
        }
        return { insert: obsInsertSpy };
      }),
    };

    const result = await createHeuristicExtractionRun(supabase as never, {
      tenantId: "tenant-1",
      actorUserId: "user-1",
      projectId: "project-1",
      intakeDraftId: "draft-1",
      text: "Kitchen painting",
    });

    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.reused).toBeUndefined();
    expect(result.run.id).toBe("run-incomplete");
    expect(result.run.observations).toHaveLength(1);
    expect(result.run.observations[0]?.id).toBe("obs-repaired");
    expect(runInsertSpy).not.toHaveBeenCalled();
    expect(obsInsertSpy).toHaveBeenCalled();
  });

  it("completes a 23505 winner that has no observations yet", async () => {
    const racedRun = {
      id: "run-winner",
      tenant_id: "tenant-1",
      project_id: "project-1",
      intake_draft_id: "draft-1",
      status: "pending_review",
      source_kind: "text_heuristic",
      source_ref: "text_heuristic.v1",
      created_at: "2026-10-30T00:00:00.000Z",
    };
    const insertedObs = [
      {
        id: "obs-race",
        run_id: "run-winner",
        kind: "room",
        label: "Kitchen",
        payload: {},
        uncertainty: "medium",
        source_coords: { field: "text", match: "kitchen" },
        review_status: "pending",
        reviewed_by: null,
        reviewed_at: null,
        review_note: null,
        created_at: "2026-10-30T00:00:00.000Z",
      },
    ];

    let runFrom = 0;
    let obsFrom = 0;
    const obsInsertSpy = vi.fn(() => ({
      select: vi.fn().mockResolvedValue({ data: insertedObs, error: null }),
    }));
    const supabase = {
      from: vi.fn((table: string) => {
        if (table === "preproject_extraction_runs") {
          runFrom += 1;
          if (runFrom === 1) {
            return chainMock({ data: null, error: null });
          }
          if (runFrom === 2) {
            return {
              insert: vi.fn(() => ({
                select: vi.fn(() => ({
                  maybeSingle: vi.fn().mockResolvedValue({
                    data: null,
                    error: { code: "23505", message: "duplicate key" },
                  }),
                })),
              })),
            };
          }
          return chainMock({ data: racedRun, error: null });
        }
        obsFrom += 1;
        if (obsFrom === 1) {
          return {
            select: vi.fn(() => ({
              eq: vi.fn(() => ({
                eq: vi.fn(() => ({
                  order: vi.fn().mockResolvedValue({ data: [], error: null }),
                })),
              })),
            })),
          };
        }
        return { insert: obsInsertSpy };
      }),
    };

    const result = await createHeuristicExtractionRun(supabase as never, {
      tenantId: "tenant-1",
      actorUserId: "user-1",
      projectId: "project-1",
      intakeDraftId: "draft-1",
      text: "Kitchen painting",
    });

    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.reused).toBeUndefined();
    expect(result.run.id).toBe("run-winner");
    expect(result.run.observations).toHaveLength(1);
    expect(obsInsertSpy).toHaveBeenCalled();
  });

  it("creates a new run when intake_draft_id is absent", async () => {
    const insertResult = {
      data: {
        id: "run-new",
        tenant_id: "tenant-1",
        project_id: "project-1",
        intake_draft_id: null,
        status: "pending_review",
        source_kind: "text_heuristic",
        source_ref: "text_heuristic.v1",
        created_at: "2026-10-30T00:00:00.000Z",
      },
      error: null,
    };
    const obsInsert = {
      data: [
        {
          id: "obs-new",
          run_id: "run-new",
          kind: "room",
          label: "Kitchen",
          payload: {},
          uncertainty: "medium",
          source_coords: { field: "text", match: "kitchen" },
          review_status: "pending",
          reviewed_by: null,
          reviewed_at: null,
          review_note: null,
          created_at: "2026-10-30T00:00:00.000Z",
        },
      ],
      error: null,
    };

    const supabase = {
      from: vi.fn((table: string) => {
        if (table === "preproject_extraction_runs") {
          return {
            insert: vi.fn(() => ({
              select: vi.fn(() => ({
                maybeSingle: vi.fn().mockResolvedValue(insertResult),
              })),
            })),
          };
        }
        return {
          insert: vi.fn(() => ({
            select: vi.fn().mockResolvedValue(obsInsert),
          })),
        };
      }),
    };

    const result = await createHeuristicExtractionRun(supabase as never, {
      tenantId: "tenant-1",
      actorUserId: "user-1",
      projectId: "project-1",
      text: "Kitchen",
    });

    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.reused).toBeUndefined();
    expect(result.run.id).toBe("run-new");
  });

  it("ships unique partial index migration for intake_draft_id", () => {
    const sql = readFileSync(
      join(
        process.cwd(),
        "supabase/migrations/20261030230000_ais_client_005a_intake_draft_idempotency.sql"
      ),
      "utf8"
    );
    expect(sql).toContain("preproject_extraction_runs_intake_draft_uidx");
    expect(sql).toContain("where intake_draft_id is not null");
  });
});
