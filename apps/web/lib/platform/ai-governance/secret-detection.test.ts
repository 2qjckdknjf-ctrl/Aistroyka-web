import { describe, expect, it } from "vitest";
import { containsSecrets, detectSecrets } from "./secret-detection";

describe("detectSecrets", () => {
  it("returns empty for clean construction prompts", () => {
    expect(
      detectSecrets("Inspect foundation pour at grid A1; report cracks and formwork.")
    ).toEqual([]);
  });

  it("detects synthetic OpenAI-style keys", () => {
    const hits = detectSecrets("token sk-abcdefghijklmnopqrstuvwxyz012345 before send");
    expect(hits.some((h) => h.kind === "openai_sk")).toBe(true);
  });

  it("detects synthetic GitHub PATs", () => {
    const hits = detectSecrets("ghp_abcdefghijklmnopqrstuvwxyz012345");
    expect(hits.some((h) => h.kind === "github_pat")).toBe(true);
  });

  it("detects PEM private key markers", () => {
    const hits = detectSecrets("-----BEGIN RSA PRIVATE KEY-----\nMIIE");
    expect(hits.some((h) => h.kind === "pem_private_key")).toBe(true);
  });

  it("detects JWT-shaped triples", () => {
    const hits = detectSecrets(
      "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIn0.abcDEFghiJKLmnoPQRstuVWXyz0123456789"
    );
    expect(hits.some((h) => h.kind === "jwt")).toBe(true);
  });

  it("containsSecrets aggregates multiple payloads", () => {
    expect(containsSecrets("ok", null, "prefix sk-abcdefghijklmnopqrstuvwxyz012345")).toBe(true);
    expect(containsSecrets("ok", "still fine")).toBe(false);
  });
});
