import { describe, expect, it } from "vitest";
import { NextResponse } from "next/server";
import {
  CUSTOMER_FINANCE_GUARD_ERROR,
  enforceCustomerFinanceOnJsonResponse,
  jsonWithCustomerFinanceGuard,
} from "./customer-finance-response";

describe("enforceCustomerFinanceOnJsonResponse", () => {
  it("returns the same object for a safe 200 response", async () => {
    const res = NextResponse.json({ data: { id: "p1", amount: 10 } }, { status: 200 });
    const out = await enforceCustomerFinanceOnJsonResponse("/portal", res);
    expect(out).toBe(res);
  });

  it("preserves custom header on safe 200", async () => {
    const res = NextResponse.json({ data: { id: "p1" } }, { status: 200 });
    res.headers.set("x-trace-id", "trace-abc");
    const out = await enforceCustomerFinanceOnJsonResponse("/portal", res);
    expect(out).toBe(res);
    expect(out.headers.get("x-trace-id")).toBe("trace-abc");
  });

  it("preserves statusText and body on safe 200", async () => {
    const payload = { data: { customer_amount_delta: 200, currency: "EUR" } };
    const res = new NextResponse(JSON.stringify(payload), {
      status: 200,
      statusText: "OK",
      headers: { "content-type": "application/json" },
    });
    const out = await enforceCustomerFinanceOnJsonResponse("/portal", res);
    expect(out).toBe(res);
    expect(out.status).toBe(200);
    expect(out.statusText).toBe("OK");
    expect(await out.json()).toEqual(payload);
  });

  it("guards safe 201 and preserves status/headers/body", async () => {
    const payload = { data: { id: "e1", total_amount: 100 } };
    const res = NextResponse.json(payload, { status: 201 });
    res.headers.set("x-request-id", "req-201");
    const out = await enforceCustomerFinanceOnJsonResponse("/portal", res);
    expect(out).toBe(res);
    expect(out.status).toBe(201);
    expect(out.headers.get("x-request-id")).toBe("req-201");
    expect(await out.json()).toEqual(payload);
  });

  it("blocks unsafe 201 without leaking key/path/value", async () => {
    const res = NextResponse.json({ data: { budget_delta_amount: 42 } }, { status: 201 });
    res.headers.set("set-cookie", "session=secret");
    const out = await enforceCustomerFinanceOnJsonResponse("/portal", res);
    expect(out.status).toBe(500);
    expect(out).not.toBe(res);
    expect(out.headers.get("set-cookie")).toBeNull();
    const body = await out.json();
    expect(body).toEqual({ error: CUSTOMER_FINANCE_GUARD_ERROR });
    expect(JSON.stringify(body)).not.toContain("budget_delta_amount");
    expect(JSON.stringify(body)).not.toContain("42");
    expect(body.path).toBeUndefined();
    expect(body.key).toBeUndefined();
  });

  it("passes through 204 without JSON parse", async () => {
    const res = new NextResponse(null, { status: 204, statusText: "No Content" });
    const out = await enforceCustomerFinanceOnJsonResponse("/portal", res);
    expect(out).toBe(res);
    expect(out.status).toBe(204);
  });

  it("returns non-2xx responses unchanged", async () => {
    const res = NextResponse.json({ error: "nope" }, { status: 403 });
    const out = await enforceCustomerFinanceOnJsonResponse("/portal", res);
    expect(out).toBe(res);
    expect(out.status).toBe(403);
  });

  it("blocks malformed successful JSON", async () => {
    const res = new NextResponse("not-json{", {
      status: 200,
      headers: { "content-type": "application/json" },
    });
    const out = await enforceCustomerFinanceOnJsonResponse("/portal", res);
    expect(out.status).toBe(500);
    const body = await out.json();
    expect(body).toEqual({ error: CUSTOMER_FINANCE_GUARD_ERROR });
  });

  it("blocks unsafe body without leaking key/path/value", async () => {
    const res = NextResponse.json({ data: { margin: 99, path: "should-not-leak" } });
    const out = await enforceCustomerFinanceOnJsonResponse("/portal", res);
    expect(out.status).toBe(500);
    const body = await out.json();
    expect(body).toEqual({ error: CUSTOMER_FINANCE_GUARD_ERROR });
    expect(JSON.stringify(body)).not.toContain("margin");
    expect(JSON.stringify(body)).not.toContain("99");
    expect(body.path).toBeUndefined();
    expect(body.key).toBeUndefined();
  });
});

describe("jsonWithCustomerFinanceGuard", () => {
  it("returns 500 without leaking forbidden path on unsafe payload", async () => {
    const res = jsonWithCustomerFinanceGuard("/api/test", { data: { margin: 1 } });
    expect(res.status).toBe(500);
    const body = await res.json();
    expect(body).toEqual({ error: CUSTOMER_FINANCE_GUARD_ERROR });
    expect(JSON.stringify(body)).not.toContain("margin");
  });
});
