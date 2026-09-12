import { describe, expect, it } from "vitest";
import { getExplicitProjectRisks } from "./project-risks.repository";

function chain(result: { data: unknown; error: unknown }) {
  const api: Record<string, unknown> = {};
  const self = () => api;
  for (const key of ["select", "eq"]) api[key] = self;
  api.then = (onFulfilled: (value: unknown) => unknown, onRejected?: (error: unknown) => unknown) =>
    Promise.resolve(result).then(onFulfilled, onRejected);
  return api;
}

describe("explicit project risks", () => {
  it("propagates database/RLS failure instead of returning a partial empty source", async () => {
    const supabase = {
      from: () => chain({ data: null, error: { message: "rls denied" } }),
    };

    await expect(
      getExplicitProjectRisks(supabase as never, "project-1", "tenant-1")
    ).rejects.toThrow("project_risks_query_failed");
  });

  it("maps verified explicit risks when the source read succeeds", async () => {
    const supabase = {
      from: () =>
        chain({
          data: [
            {
              id: "risk-1",
              title: "Structural delay",
              description: "Verified manual risk",
              severity: "high",
            },
          ],
          error: null,
        }),
    };

    const risks = await getExplicitProjectRisks(supabase as never, "project-1", "tenant-1");
    expect(risks).toHaveLength(1);
    expect(risks[0]).toMatchObject({
      source: "manual",
      severity: "high",
      title: "Structural delay",
      resourceId: "risk-1",
    });
  });
});
