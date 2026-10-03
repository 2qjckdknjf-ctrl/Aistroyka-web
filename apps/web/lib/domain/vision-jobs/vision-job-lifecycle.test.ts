import { describe, expect, it } from "vitest";
import {
  classifyVisionFailure,
  mapAnalysisJobToLifecycle,
  VISION_MAX_ATTEMPTS,
} from "./vision-job-lifecycle";

describe("mapAnalysisJobToLifecycle", () => {
  it("maps queued and pending to QUEUED", () => {
    expect(mapAnalysisJobToLifecycle({ status: "queued" })).toBe("QUEUED");
    expect(mapAnalysisJobToLifecycle({ status: "pending" })).toBe("QUEUED");
  });

  it("maps processing and completed", () => {
    expect(mapAnalysisJobToLifecycle({ status: "processing" })).toBe("PROCESSING");
    expect(mapAnalysisJobToLifecycle({ status: "completed" })).toBe("SUCCEEDED");
  });

  it("maps failed timeout under max attempts as retryable", () => {
    expect(
      mapAnalysisJobToLifecycle({ status: "failed", error_type: "timeout", attempts: 1 })
    ).toBe("FAILED_RETRYABLE");
  });

  it("maps exhausted retries as final", () => {
    expect(
      mapAnalysisJobToLifecycle({
        status: "failed",
        error_type: "timeout",
        attempts: VISION_MAX_ATTEMPTS,
      })
    ).toBe("FAILED_FINAL");
  });

  it("does not treat unknown status as success", () => {
    expect(mapAnalysisJobToLifecycle({ status: null })).toBe("FAILED_FINAL");
    expect(mapAnalysisJobToLifecycle({ status: "success" })).toBe("FAILED_FINAL");
  });
});

describe("classifyVisionFailure", () => {
  it("classifies timeout and network as retryable", () => {
    expect(classifyVisionFailure("provider timeout")).toEqual({ errorType: "timeout", retryable: true });
    expect(classifyVisionFailure("fetch failed")).toMatchObject({ retryable: true });
  });

  it("classifies not-implemented as final", () => {
    expect(classifyVisionFailure("Video processing not implemented yet")).toEqual({
      errorType: "validation_error",
      retryable: false,
    });
  });
});
