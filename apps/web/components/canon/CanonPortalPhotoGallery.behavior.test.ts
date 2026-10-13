/** @vitest-environment jsdom */
import { act, createElement } from "react";
import { createRoot, type Root } from "react-dom/client";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { CanonPortalPhotoGallery } from "./CanonPortalPhotoGallery";
vi.mock("next-intl", () => ({ useTranslations: () => (key: string) => key }));
const projectId = "00000000-0000-4000-8000-000000000001";
const id = "00000000-0000-4000-8000-000000000002";
const original = `/api/v1/portal/projects/${projectId}/evidence/${id}/original`;
const published = { data: { project: { id: projectId }, items: [{ id, original_url: original, zone_label: "Kitchen", manager_verified: true }] } };
describe("real Customer portal gallery", () => {
  let host: HTMLDivElement, root: Root, client: QueryClient;
  let status: number, payload: unknown;
  beforeEach(() => {
    (globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;
    host = document.createElement("div"); document.body.appendChild(host); root = createRoot(host);
    client = new QueryClient({ defaultOptions: { queries: { retry: false } } }); status = 200; payload = published;
    vi.stubGlobal("fetch", vi.fn(async () => ({ ok: status === 200, status, json: async () => payload })));
  });
  afterEach(() => { act(() => root.unmount()); client.clear(); host.remove(); vi.unstubAllGlobals(); });
  async function render() {
    await act(async () => { root.render(createElement(QueryClientProvider, { client }, createElement(CanonPortalPhotoGallery, { projectId }))); });
    await act(async () => { await new Promise(resolve => setTimeout(resolve, 20)); });
  }
  async function refresh() {
    await act(async () => { await client.invalidateQueries({ queryKey: ["portal-published-photos", projectId] }); });
    await act(async () => { await new Promise(resolve => setTimeout(resolve, 20)); });
  }
  it("renders published photos using only the current-access gateway", async () => {
    await render(); expect(host.querySelector("img")?.getAttribute("src")).toBe(original);
    expect(host.querySelector("a")?.getAttribute("href")).toBe(original);
    expect(host.textContent).toContain("portalPhotosVerified");
  });
  it("removes cached images and links after grant revocation", async () => {
    await render(); expect(host.querySelector("img")).not.toBeNull(); status = 404; await refresh();
    expect(host.querySelector("img")).toBeNull(); expect(host.querySelector("a")).toBeNull();
    expect(host.textContent).toContain("portalPhotosAccessUnavailable");
    expect(host.textContent).not.toContain("portalPhotosEmpty");
  });
  it("keeps dependency failure distinct from empty photos and supports retry", async () => {
    status = 503; await render(); expect(host.textContent).toContain("portalPhotosLoadError");
    expect(host.textContent).not.toContain("portalPhotosEmpty"); status = 200;
    await act(async () => { host.querySelector("button")!.dispatchEvent(new MouseEvent("click", { bubbles: true })); });
    await act(async () => { await new Promise(resolve => setTimeout(resolve, 20)); });
    expect(host.querySelector("img")?.getAttribute("src")).toBe(original);
  });
  it("shows an unavailable original rather than a broken photo link", async () => {
    await render();
    await act(async () => { host.querySelector("img")!.dispatchEvent(new Event("error")); });
    expect(host.querySelector("img")).toBeNull(); expect(host.querySelector("a")).toBeNull();
    expect(host.textContent).toContain("portalPhotosOriginalUnavailable");
  });
  it("shows truthful empty state after publication withdrawal", async () => {
    await render(); payload = { data: { project: { id: projectId }, items: [] } }; await refresh();
    expect(host.querySelector("img")).toBeNull(); expect(host.textContent).toContain("portalPhotosEmpty");
  });
});
