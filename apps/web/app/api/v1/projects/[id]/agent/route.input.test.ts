import { describe, expect, it } from "vitest";
import {
  AGENT_BODY_MAX_CHARS,
  AGENT_MESSAGE_MAX_CHARS,
  parseAgentRequestBody,
} from "./route";

function requestWithBody(body: string): Request {
  return new Request("https://example.test/api/v1/projects/p1/agent", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body,
  });
}

describe("project agent input bounds", () => {
  it("rejects valid JSON null instead of throwing", async () => {
    await expect(parseAgentRequestBody(requestWithBody("null"))).resolves.toEqual({
      ok: false,
      error: "JSON body must be an object",
    });
  });

  it("rejects arrays and missing message", async () => {
    await expect(parseAgentRequestBody(requestWithBody("[]"))).resolves.toMatchObject({ ok: false });
    await expect(parseAgentRequestBody(requestWithBody("{}"))).resolves.toEqual({
      ok: false,
      error: "message required",
    });
  });

  it("rejects messages above the documented character cap", async () => {
    const message = "x".repeat(AGENT_MESSAGE_MAX_CHARS + 1);
    const result = await parseAgentRequestBody(requestWithBody(JSON.stringify({ message })));
    expect(result).toEqual({
      ok: false,
      error: `message exceeds ${AGENT_MESSAGE_MAX_CHARS} characters`,
    });
  });

  it("rejects oversized request bodies before JSON parsing", async () => {
    const result = await parseAgentRequestBody(
      requestWithBody("x".repeat(AGENT_BODY_MAX_CHARS + 1))
    );
    expect(result).toEqual({ ok: false, error: "request body too large" });
  });

  it("accepts and trims a bounded message", async () => {
    await expect(
      parseAgentRequestBody(requestWithBody(JSON.stringify({ message: "  status?  " })))
    ).resolves.toEqual({ ok: true, message: "status?" });
  });
});
