import { describe, expect, it } from "vitest";
import {
  classifyProviderHttpStatus,
  classifyVisionFailure,
  mapAnalysisJobToLifecycle,
  mapPollStatusJobs,
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

  it("maps timeout under max attempts as retryable", () => {
    expect(
      mapAnalysisJobToLifecycle({ status: "failed", error_type: "timeout", attempts: 1 })
    ).toBe("FAILED_RETRYABLE");
  });

  it("maps provider_unavailable under max attempts as retryable", () => {
    expect(
      mapAnalysisJobToLifecycle({
        status: "failed",
        error_type: "provider_unavailable",
        attempts: 2,
      })
    ).toBe("FAILED_RETRYABLE");
  });

  it("maps permanent invalid_request as final even on first attempt", () => {
    expect(
      mapAnalysisJobToLifecycle({
        status: "failed",
        error_type: "invalid_request",
        attempts: 1,
      })
    ).toBe("FAILED_FINAL");
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

  it("classifies structured provider 4xx as final without parsing the body", () => {
    for (const status of [400, 401, 403, 404]) {
      expect(classifyProviderHttpStatus(status)).toEqual({ errorType: "invalid_request", retryable: false });
      expect(classifyVisionFailure({ message: "ignored body", httpStatus: status })).toEqual({
        errorType: "invalid_request",
        retryable: false,
      });
    }
  });

  it("classifies 429 and 5xx as retryable", () => {
    expect(classifyProviderHttpStatus(429)).toEqual({ errorType: "provider_unavailable", retryable: true });
    expect(classifyProviderHttpStatus(503)).toEqual({ errorType: "provider_unavailable", retryable: true });
  });
});

describe("mapPollStatusJobs", () => {
  it("keeps an empty jobs array for the poll contract", () => {
    expect(mapPollStatusJobs([], Date.now(), 1000)).toEqual({ hasActiveJobs: false, jobs: [] });
  });

  it("uses error_type so poll and single-job GET agree", () => {
    const mapped = mapPollStatusJobs(
      [
        { id: "j1", status: "failed", error_type: "timeout", attempt_count: 1 },
        { id: "j2", status: "failed", error_type: "invalid_request", attempt_count: 1 },
      ],
      Date.now(),
      60_000
    );
    expect(mapped.jobs[0]?.lifecycle).toBe("FAILED_RETRYABLE");
    expect(mapped.jobs[1]?.lifecycle).toBe("FAILED_FINAL");
  });
});
