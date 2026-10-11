/** @vitest-environment jsdom */
import { act, createElement } from "react";
import { createRoot, type Root } from "react-dom/client";
import { beforeEach, afterEach, expect, it, vi } from "vitest";
import { ReportPublicationControls } from "./ReportPublicationControls";
vi.mock("next-intl", () => ({ useTranslations: () => (key: string) => key }));
vi.mock("next/image", () => ({ default: ({ unoptimized: _, ...props }: Record<string, unknown>) => createElement("img", props) }));
let host: HTMLDivElement, root: Root, status: number, state: Record<string, unknown>, fetcher: ReturnType<typeof vi.fn>;
beforeEach(() => {
  (globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;
  host = document.createElement("div"); document.body.append(host); root = createRoot(host); status = 200;
  state = { report_id: "report", project_id: "project", report_status: "approved", portal_enabled: true,
    items: [{ attachment_id: "attachment", media_id: "media", upload_session_id: null, published: false, eligible: true, evidence_id: null, version: null }] };
  fetcher = vi.fn(async (_url: string, options: RequestInit) => {
    if (options.method === "PATCH" && status === 200) (state.items as Array<Record<string, unknown>>)[0] = { ...(state.items as Array<Record<string, unknown>>)[0], published: true, version: "new-version" };
    return { ok: status === 200, status, json: async () => ({ data: state }) };
  }); vi.stubGlobal("fetch", fetcher);
});
afterEach(() => { act(() => root.unmount()); host.remove(); vi.unstubAllGlobals(); });
async function render() { await act(async () => root.render(createElement(ReportPublicationControls, { reportId: "report", previews: [{ media_id: "media", upload_session_id: null, file_url: "/exact-preview" }] }))); }
async function focus() { await act(async () => window.dispatchEvent(new Event("focus"))); }
async function click() { await act(async () => host.querySelector("button")!.dispatchEvent(new MouseEvent("click", { bubbles: true }))); }
it("shows the exact attachment preview and keeps approved photos private until an explicit action", async () => {
  await render(); expect(host.querySelector("img")?.getAttribute("src")).toBe("/exact-preview"); expect(host.textContent).toContain("reportPublicationPrivate");
  expect(fetcher.mock.calls.every(([, options]) => options.method !== "PATCH")).toBe(true);
  await click(); expect(fetcher.mock.calls.find(([, options]) => options.method === "PATCH")?.[1].body).toBe(JSON.stringify({ attachment_id: "attachment", visible: true, expected_version: null }));
  expect(host.textContent).toContain("reportPublicationVisible");
});
it("hides the manager control from a field caller who can read their own report", async () => {
  status = 403; await render(); expect(host.querySelector("section")).toBeNull();
});
it("clears stale buttons after a failed access refresh", async () => {
  await render(); status = 503; await focus(); expect(host.textContent).toContain("reportPublicationError");
  expect(host.querySelector("img")).toBeNull(); expect(host.textContent).not.toContain("reportPublicationPublishPhoto");
});
it("requires a refresh after a concurrent publication conflict and never claims success", async () => {
  await render(); status = 409; await click(); expect(host.textContent).toContain("reportPublicationStale"); expect(host.textContent).not.toContain("reportPublicationVisible");
  status = 200; await click(); expect(host.textContent).toContain("reportPublicationPrivate");
});
it("disables publication while the report is unapproved or the portal is disabled", async () => {
  state.report_status = "submitted"; await render(); expect(host.querySelector("button")?.disabled).toBe(true);
  state.report_status = "approved"; state.portal_enabled = false; await focus(); expect(host.querySelector("button")?.disabled).toBe(true);
});
