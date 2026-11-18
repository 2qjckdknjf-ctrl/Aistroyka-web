import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const CHAT_API = resolve(__dirname, "../features/ai/api/chatApi.ts");
const THREAD_HOOK = resolve(__dirname, "../features/ai/api/useCopilotThread.ts");
const CHAT_PANEL = resolve(__dirname, "../features/ai/components/CopilotChatPanel.tsx");
const HISTORY_SERVICE = resolve(__dirname, "./chat-history.service.ts");

describe("copilot thread transport hardening", () => {
  const chatApi = readFileSync(CHAT_API, "utf8");
  const hook = readFileSync(THREAD_HOOK, "utf8");
  const panel = readFileSync(CHAT_PANEL, "utf8");
  const service = readFileSync(HISTORY_SERVICE, "utf8");

  it("contains no dependency or fallback to the non-deployed aistroyka-ai-chat Edge Function", () => {
    expect(chatApi).not.toContain("/functions/v1/aistroyka-ai-chat");
    expect(chatApi).not.toContain('action: "list_threads"');
    expect(chatApi).not.toContain('action: "get_thread"');
    expect(chatApi).not.toContain('action: "create_thread"');
    expect(chatApi).not.toContain('action: "archive_thread"');
    expect(chatApi).not.toContain('action: "send_chat_message"');
    expect(chatApi).not.toContain("getPublicEnv");
  });

  it("uses project-scoped same-origin Next APIs for history and stream send", () => {
    expect(chatApi).toContain("/api/v1/projects/");
    expect(chatApi).toContain("/copilot/chat");
    expect(chatApi).toContain("/threads");
    expect(chatApi).toContain("/stream");
    expect(hook).toContain("getThread(projectId, activeThreadId, getAuthToken)");
    expect(hook).toContain("archiveThread(projectId, activeThreadId, getAuthToken)");
  });

  it("does not expose the undeployed thread-summary refresh surface", () => {
    expect(panel).not.toContain("useThreadSummary");
    expect(panel).not.toContain("requestMemoryRefresh");
    expect(panel).not.toContain("Refresh summary");
    expect(chatApi).not.toContain("get_thread_summary");
    expect(chatApi).not.toContain("request_memory_refresh");
  });

  it("does not select the drifted low_confidence column from the live message table", () => {
    expect(service).toContain(
      '"id, thread_id, role, content, request_id, error_kind, created_at"'
    );
    expect(service).not.toContain(
      '"id, thread_id, role, content, request_id, error_kind, low_confidence, created_at"'
    );
    expect(service).toContain("low_confidence: false");
  });

  it("archives chat threads and contains no delete path in the history service", () => {
    expect(service).toContain('update({ status: "archived"');
    expect(service).not.toMatch(/\.delete\s*\(/);
  });
});
