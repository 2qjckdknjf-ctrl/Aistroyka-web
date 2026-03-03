import { describe, expect, it } from "vitest";
import { isNoRetryStatus, defaultRetry } from "./queryClient";

describe("queryClient retry policy", () => {
  it("does not retry on 401", () => {
    expect(defaultRetry(0, { status: 401 })).toBe(false);
    expect(defaultRetry(1, { status: 401 })).toBe(false);
  });
  it("does not retry on 403", () => {
    expect(defaultRetry(0, { status: 403 })).toBe(false);
  });
  it("does not retry on 404", () => {
    expect(defaultRetry(0, { status: 404 })).toBe(false);
  });
  it("retries up to 2 times for other errors", () => {
    expect(defaultRetry(0, new Error("network"))).toBe(true);
    expect(defaultRetry(1, new Error("network"))).toBe(true);
    expect(defaultRetry(2, new Error("network"))).toBe(false);
  });
  it("isNoRetryStatus returns true for 401/403/404", () => {
    expect(isNoRetryStatus({ status: 401 })).toBe(true);
    expect(isNoRetryStatus({ status: 403 })).toBe(true);
    expect(isNoRetryStatus({ status: 404 })).toBe(true);
  });
  it("isNoRetryStatus returns false for 500 or no status", () => {
    expect(isNoRetryStatus({ status: 500 })).toBe(false);
    expect(isNoRetryStatus(new Error())).toBe(false);
  });
});
