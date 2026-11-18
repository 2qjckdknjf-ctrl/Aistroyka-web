import { describe, expect, it, vi } from "vitest";
import {
  fieldDailyLogDraftBody,
  fieldDailyLogMediaRefsForSave,
  persistThenConfirmFieldDailyLog,
  type FieldDailyLogFormValues,
} from "./field-daily-log-form";

const values: FieldDailyLogFormValues = {
  workDate: "2026-09-26",
  note: "zone B, 40m3",
  summary: "pour",
  workDone: "slab",
  blockers: "pump late",
  weather: "dry",
  mediaRef: " media-1 ",
};

function jsonResponse(status: number, body: unknown): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

describe("fieldDailyLogMediaRefsForSave", () => {
  it("keeps media refs the single field does not show", () => {
    expect(fieldDailyLogMediaRefsForSave(" media-1 ", ["old", "media-2", " media-3 "])).toEqual([
      "media-1",
      "media-2",
      "media-3",
    ]);
  });

  it("drops only the visible slot when the field is cleared", () => {
    expect(fieldDailyLogMediaRefsForSave("  ", ["media-1", "media-2"])).toEqual(["media-2"]);
  });
});

describe("fieldDailyLogDraftBody", () => {
  it("sends the visible form plus hidden media refs", () => {
    expect(fieldDailyLogDraftBody(values, ["old", "media-2"])).toEqual({
      work_date: "2026-09-26",
      note: "zone B, 40m3",
      summary: "pour",
      work_done: "slab",
      blockers: "pump late",
      weather: "dry",
      media_refs: ["media-1", "media-2"],
    });
  });
});

describe("persistThenConfirmFieldDailyLog", () => {
  it("patches the visible draft before confirm", async () => {
    const fetchImpl = vi.fn(async (input: string) => {
      if (input.endsWith("/confirm")) return jsonResponse(200, { data: { status: "confirmed" } });
      return jsonResponse(200, { data: { status: "draft" } });
    });

    const result = await persistThenConfirmFieldDailyLog(
      fetchImpl,
      "proj-1",
      "log-1",
      values,
      ["old", "media-2"]
    );

    expect(result).toEqual({ ok: true });
    expect(fetchImpl).toHaveBeenCalledTimes(2);
    const [saveUrl, saveInit] = fetchImpl.mock.calls[0]!;
    expect(saveUrl).toBe("/api/v1/projects/proj-1/field-daily-logs/log-1");
    expect(saveInit?.method).toBe("PATCH");
    expect(JSON.parse(String(saveInit?.body))).toMatchObject({
      note: "zone B, 40m3",
      work_done: "slab",
      media_refs: ["media-1", "media-2"],
    });
    expect(fetchImpl.mock.calls[1]?.[0]).toBe(
      "/api/v1/projects/proj-1/field-daily-logs/log-1/confirm"
    );
    expect(fetchImpl.mock.calls[1]?.[1]?.method).toBe("POST");
  });

  it("does not confirm when the draft save fails", async () => {
    const fetchImpl = vi.fn(async () => jsonResponse(409, { error: "Only draft logs can be edited" }));

    const result = await persistThenConfirmFieldDailyLog(fetchImpl, "proj-1", "log-1", values);

    expect(result).toEqual({ ok: false, error: "Only draft logs can be edited" });
    expect(fetchImpl).toHaveBeenCalledTimes(1);
    expect(String(fetchImpl.mock.calls[0]?.[0])).not.toContain("/confirm");
  });
});
