/** @vitest-environment jsdom */
import { act, createElement, type ComponentType, type ReactNode } from "react";
import { createRoot, type Root } from "react-dom/client";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import en from "@/messages/en.json";
import ru from "@/messages/ru.json";
import es from "@/messages/es.json";
import itMessages from "@/messages/it.json";
import { ProjectTradeCompletenessPanel } from "./ProjectTradeCompletenessPanel";
import { ProjectReconciliationFindingsPanel } from "./ProjectReconciliationFindingsPanel";
import { ProjectPreprojectExtractionPanel } from "./ProjectPreprojectExtractionPanel";
import { ProjectQuantitiesPanel } from "./ProjectQuantitiesPanel";

const translation = vi.hoisted(() => ({ messages: {} as Record<string, string> }));
vi.mock("next-intl", () => ({ useTranslations: () => (key: string, values?: Record<string, unknown>) =>
  (translation.messages[key] ?? key).replace(/\{([^}]+)\}/g, (_, name: string) => String(values?.[name] ?? `{${name}}`)) }));
vi.mock("@/components/ui", () => ({
  Button: (props: Record<string, unknown>) => createElement("button", props),
  Input: (props: Record<string, unknown>) => createElement("input", props),
  Skeleton: () => createElement("div"),
  EmptyState: ({ title }: { title: string }) => createElement("p", null, title),
}));
vi.mock("@/components/canon/CanonSurface", () => ({
  CanonSurface: ({ isCanon, children }: { isCanon?: boolean; children: ReactNode }) =>
    createElement("section", { "data-canon": String(Boolean(isCanon)) }, children),
}));

let host: HTMLDivElement;
let root: Root;
let client: QueryClient;
let fetcher: ReturnType<typeof vi.fn>;
const json = (data: unknown, status = 200) => ({ ok: status < 400, status, json: async () => data });
beforeEach(() => {
  (globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;
  host = document.createElement("div"); document.body.append(host); root = createRoot(host);
  client = new QueryClient({ defaultOptions: { queries: { retry: false }, mutations: { retry: false } } });
  translation.messages = {};
  fetcher = vi.fn(async () => json({ data: { templates: [], findings: [], drafts: [], runs: [], snapshots: [] } }));
  vi.stubGlobal("fetch", fetcher);
});
afterEach(() => { act(() => root.unmount()); client.clear(); host.remove(); vi.unstubAllGlobals(); });
async function settle() { await act(async () => { await new Promise(resolve => setTimeout(resolve, 5)); }); }
async function render(component: ComponentType<{ projectId: string; skin?: "default" | "canon" }>, projectId = "project") {
  await act(async () => root.render(createElement(QueryClientProvider, { client }, createElement(component, { projectId, skin: "canon" }))));
  await settle();
}
async function click(element: Element) {
  await act(async () => element.dispatchEvent(new MouseEvent("click", { bubbles: true })));
  await settle();
}
function button(label: string) {
  const found = [...host.querySelectorAll("button")].find(node => node.textContent === label);
  if (!found) throw new Error(`Missing button: ${label}`);
  return found;
}
async function change(element: HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement, value: string) {
  const prototype = element instanceof HTMLTextAreaElement ? HTMLTextAreaElement.prototype :
    element instanceof HTMLSelectElement ? HTMLSelectElement.prototype : HTMLInputElement.prototype;
  await act(async () => {
    Object.getOwnPropertyDescriptor(prototype, "value")!.set!.call(element, value);
    element.dispatchEvent(new Event(element instanceof HTMLSelectElement ? "change" : "input", { bubbles: true }));
  });
}
async function submit(form: HTMLFormElement) {
  await act(async () => form.dispatchEvent(new Event("submit", { bubbles: true, cancelable: true })));
  await settle();
}

const template = { id: "trade.waterproofing.wet_area", version: "1.0.0", trade: "waterproofing", requirement_count: 9, jurisdiction_note: "English-only jurisdiction note" };
const evaluation = {
  templateId: template.id, templateVersion: "1.0.0", trade: "waterproofing", verdict: "READY_FOR_HUMAN_REVIEW",
  items: [{ requirementId: "wp.contract_scope", evidenceKind: "contract_scope", severity: "required", label: "English-only contract requirement", status: "missing", question: "English-only missing question" }],
  questions: [], missingRequiredCount: 1, missingRecommendedCount: 0,
};
function completenessFixture(post?: () => Promise<unknown>) {
  fetcher.mockImplementation(async (_url: string, options?: RequestInit) => options?.method === "POST"
    ? post ? post() : json({ data: { evaluation } })
    : json({ data: { templates: [template] } }));
}

describe("completeness evaluation stays bound to its input", () => {
  it("removes a displayed verdict immediately when the evidence inventory changes", async () => {
    completenessFixture(); await render(ProjectTradeCompletenessPanel);
    await click(button("completenessEvaluate"));
    expect(host.textContent).toContain("completenessVerdict");
    await click(host.querySelector('input[type="checkbox"]')!);
    expect(host.textContent).not.toContain("completenessVerdict");
  });
  it("discards an in-flight response after edits, even when the selection returns to its original value", async () => {
    let complete!: (value: unknown) => void;
    completenessFixture(() => new Promise(resolve => { complete = resolve; }));
    await render(ProjectTradeCompletenessPanel); await click(button("completenessEvaluate"));
    const checkbox = host.querySelector('input[type="checkbox"]')!;
    await click(checkbox); await click(checkbox);
    await act(async () => complete(json({ data: { evaluation } }))); await settle();
    expect(host.textContent).not.toContain("completenessVerdict");
  });
  it("does not show a response from the previous project", async () => {
    let complete!: (value: unknown) => void;
    completenessFixture(() => new Promise(resolve => { complete = resolve; }));
    await render(ProjectTradeCompletenessPanel); await click(button("completenessEvaluate"));
    await render(ProjectTradeCompletenessPanel, "different-project");
    await act(async () => complete(json({ data: { evaluation } }))); await settle();
    expect(host.textContent).not.toContain("completenessVerdict");
  });
  it("does not show a delayed failure from an earlier project or inventory revision", async () => {
    let fail!: (reason: unknown) => void;
    completenessFixture(() => new Promise((_resolve, reject) => { fail = reject; }));
    await render(ProjectTradeCompletenessPanel); await click(button("completenessEvaluate"));
    await render(ProjectTradeCompletenessPanel, "different-project");
    await act(async () => fail(new Error("previous request failed"))); await settle();
    expect(host.textContent).not.toContain("completenessEvalFailed");
    completenessFixture(async () => json({ error: "current request failed" }, 503));
    await click(button("completenessEvaluate"));
    expect(host.textContent).toContain("completenessEvalFailed");
    await click(host.querySelector('input[type="checkbox"]')!);
    expect(host.textContent).not.toContain("completenessEvalFailed");
  });
  it.each([en, ru, es, itMessages])("localizes known checklist text, state and questions", async (messages) => {
    translation.messages = messages.dashboardDetail as Record<string, string>;
    completenessFixture(); await render(ProjectTradeCompletenessPanel);
    await click(button(translation.messages.completenessEvaluate));
    expect(host.textContent).not.toContain("English-only");
    expect(host.textContent).not.toContain("READY_FOR_HUMAN_REVIEW");
    expect(host.textContent).not.toContain("(required)");
    expect(host.textContent).toContain(translation.messages.completenessRequirement_wp_contract_scope);
    expect(host.textContent).toContain(translation.messages.completenessMissing_wp_contract_scope);
    expect(host.textContent).toContain(translation.messages.completenessWaterproofingNote);
  });
});

describe("finding ledger data and review errors", () => {
  it.each(["", "   "])("requires explicit quantities rather than treating %j as measured zero", async (blank) => {
    await render(ProjectReconciliationFindingsPanel);
    const inputs = host.querySelectorAll("input");
    await change(inputs[0], "Mismatch"); await change(host.querySelector("textarea")!, "Source differs");
    await change(inputs[1], blank); await change(inputs[2], "0");
    expect(button("reconCreate").disabled).toBe(true);
    await submit(host.querySelector("form")!);
    expect(fetcher.mock.calls.some(([, options]) => options?.method === "POST")).toBe(false);
    await change(inputs[1], "0");
    expect(button("reconCreate").disabled).toBe(false);
  });
  it("shows a failed review and refreshes a concurrently reviewed finding", async () => {
    let reviewed = false;
    fetcher.mockImplementation(async (_url: string, options?: RequestInit) => {
      if (options?.method === "POST") { reviewed = true; return json({ error: "already reviewed", code: "ALREADY_REVIEWED" }, 409); }
      return json({ data: { findings: [{ id: "finding", kind: "quantity_mismatch", status: reviewed ? "accepted" : "needs_review", title: "Example", summary: "Source", expected_quantity: 1, observed_quantity: 2 }] } });
    });
    await render(ProjectReconciliationFindingsPanel); await click(button("reconAccept")); await settle();
    expect(host.querySelector('[role="alert"]')?.textContent).toContain("reconReviewFailed");
    expect([...host.querySelectorAll("button")].some(node => node.textContent === "reconAccept")).toBe(false);
  });
  it.each([en, ru, es, itMessages])("localizes the kind and review state", async (messages) => {
    translation.messages = messages.dashboardDetail as Record<string, string>;
    fetcher.mockResolvedValue(json({ data: { findings: [{ id: "finding", kind: "quantity_mismatch", status: "needs_review", title: "Example", summary: "Source" }] } }));
    await render(ProjectReconciliationFindingsPanel);
    expect(host.textContent).not.toContain("quantity_mismatch"); expect(host.textContent).not.toContain("needs_review");
    expect(host.textContent).toContain(translation.messages.reconKind_quantity_mismatch);
    expect(host.textContent).toContain(translation.messages.reconStatus_needs_review);
  });
});

it("starts the next preproject extraction without the previous intake draft", async () => {
  fetcher.mockImplementation(async (url: string, options?: RequestInit) => {
    if (options?.method === "POST") return json({ data: { id: "run", observations: [] } });
    return json({ data: { runs: [], drafts: url.endsWith("intake-drafts") ? [{ id: "draft", title: "Intake", description: "Existing draft text", status: "submitted" }] : [] } });
  });
  await render(ProjectPreprojectExtractionPanel);
  await change(host.querySelector("select")!, "draft");
  await submit(host.querySelector("form")!);
  await change(host.querySelector("textarea")!, "A different new scope");
  await submit(host.querySelector("form")!);
  const requests = fetcher.mock.calls.filter(([, options]) => options?.method === "POST").map(([, options]) => JSON.parse(options.body));
  expect(requests).toEqual([{ text: "Existing draft text", intake_draft_id: "draft" }, { text: "A different new scope" }]);
});

it("keeps accepted quantity binding after idempotent recompute and clears it for a new calculation", async () => {
  let calculationId = "calculation-one";
  fetcher.mockImplementation(async (url: string, options?: RequestInit) => {
    if (options?.method !== "POST") return json({ data: { snapshots: [], drafts: [] } });
    if (url.endsWith("/acceptance")) return json({ data: { id: "acceptance", decision: "accepted", commercially_bindable: true } });
    return json({ data: { created: false, snapshot: { id: "snapshot", request_hash: "a".repeat(64) }, calculation: { id: calculationId, revision: 1, quantity: "8.820000", unit: "m2", quantity_basis: "physical_net", issues: [] } } });
  });
  await render(ProjectQuantitiesPanel);
  expect(host.querySelector("section")?.dataset.canon).toBe("true");
  await submit(host.querySelector("form")!); await click(button("quantitiesAccept"));
  expect(button("quantitiesBindCommercial")).toBeDefined();
  await submit(host.querySelector("form")!);
  expect(button("quantitiesBindCommercial")).toBeDefined();
  calculationId = "calculation-two";
  await submit(host.querySelector("form")!);
  expect([...host.querySelectorAll("button")].some(node => node.textContent === "quantitiesBindCommercial")).toBe(false);
});
