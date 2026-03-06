import { describe, expect, it } from "vitest";
import { parseTablePagination } from "./useTablePagination";

describe("parseTablePagination", () => {
  it("parses page and pageSize with defaults", () => {
    const r = parseTablePagination({});
    expect(r.page).toBe(1);
    expect(r.pageSize).toBe(25);
    expect(r.offset).toBe(0);
    expect(r.limit).toBe(25);
  });

  it("parses page=2, pageSize=50", () => {
    const r = parseTablePagination({ page: "2", pageSize: "50" });
    expect(r.page).toBe(2);
    expect(r.pageSize).toBe(50);
    expect(r.offset).toBe(50);
    expect(r.limit).toBe(50);
  });

  it("clamps page to at least 1", () => {
    const r = parseTablePagination({ page: "0", pageSize: "25" });
    expect(r.page).toBe(1);
    expect(r.offset).toBe(0);
  });

  it("clamps pageSize to 10-100", () => {
    expect(parseTablePagination({ pageSize: "5" }).pageSize).toBe(10);
    expect(parseTablePagination({ pageSize: "200" }).pageSize).toBe(100);
  });

  it("invalid page falls back to 1", () => {
    const r = parseTablePagination({ page: "x", pageSize: "25" });
    expect(r.page).toBe(1);
    expect(r.offset).toBe(0);
  });
});
