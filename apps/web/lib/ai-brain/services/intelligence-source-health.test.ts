import { describe, expect, it } from "vitest";
import { getTaskSignals } from "../mappers/task-signals.mapper";
import { getReportSignals } from "./report-intelligence.service";
import { getEvidenceSignals } from "./evidence-intelligence.service";
import { getSchedulePressureSignal } from "./schedule-pressure.service";
import { getMilestonePressureSignals } from "./milestone-pressure.service";
import { getCostRiskSignals } from "./cost-signals.service";

function chain(result: { data: unknown; error: unknown }) {
  const api: Record<string, unknown> = {};
  const self = () => api;
  for (const key of ["select", "eq", "in", "not", "gte", "lt", "neq", "order", "limit"]) {
    api[key] = self;
  }
  api.then = (onFulfilled: (value: unknown) => unknown, onRejected?: (error: unknown) => unknown) =>
    Promise.resolve(result).then(onFulfilled, onRejected);
  return api;
}

describe("AI Brain source health", () => {
  it("rejects a failed task-signal source read", async () => {
    const supabase = {
      from: () => chain({ data: null, error: { message: "rls denied" } }),
    };
    await expect(getTaskSignals(supabase as never, "p1", "t1")).rejects.toThrow(
      "task_signals_tasks_query_failed"
    );
  });

  it("rejects a failed report-day source read instead of fabricating missing reports", async () => {
    const supabase = {
      from: () => chain({ data: null, error: { message: "db down" } }),
    };
    await expect(getReportSignals(supabase as never, "p1", "t1")).rejects.toThrow(
      "report_signals_days_query_failed"
    );
  });

  it("rejects failed report-media evidence reads instead of fabricating evidence gaps", async () => {
    const supabase = {
      from: (table: string) => {
        if (table === "worker_tasks") {
          return chain({
            data: [{ id: "task-1", required_photos: { before: 1 }, title: "Wall" }],
            error: null,
          });
        }
        if (table === "worker_reports") {
          return chain({ data: [{ id: "report-1" }], error: null });
        }
        if (table === "worker_report_media") {
          return chain({ data: null, error: { message: "rls denied" } });
        }
        return chain({ data: [], error: null });
      },
    };
    await expect(getEvidenceSignals(supabase as never, "p1", "t1")).rejects.toThrow(
      "evidence_report_media_query_failed"
    );
  });

  it("rejects schedule, milestone and cost source failures", async () => {
    const failing = {
      from: () => chain({ data: null, error: { message: "db down" } }),
    };
    await expect(getSchedulePressureSignal(failing as never, "p1", "t1")).rejects.toThrow(
      "schedule_pressure_tasks_query_failed"
    );
    await expect(getMilestonePressureSignals(failing as never, "p1", "t1")).rejects.toThrow(
      "milestone_pressure_milestones_query_failed"
    );
    await expect(getCostRiskSignals(failing as never, "p1", "t1")).rejects.toThrow(
      "cost_risk_items_query_failed"
    );
  });
});
