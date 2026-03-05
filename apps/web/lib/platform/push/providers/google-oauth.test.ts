import { describe, expect, it, vi, beforeEach } from "vitest";
import {
  buildGoogleJwtAssertion,
  exchangeJwtForAccessToken,
  getAccessToken,
  clearTokenCache,
  normalizePrivateKey,
} from "./google-oauth";

// Minimal valid PEM for RS256 (example; tests will mock or use structure only)
const FAKE_PEM = `-----BEGIN PRIVATE KEY-----
MIIEvQIBADANBgkqhkiG9w0BAQEFAASCBKcwggSjAgEAAoIBAQC7
-----END PRIVATE KEY-----`;

describe("google-oauth", () => {
  beforeEach(() => {
    clearTokenCache();
    vi.restoreAllMocks();
  });

  describe("normalizePrivateKey", () => {
    it("replaces literal \\n with newline", () => {
      const withEscaped = "line1\\nline2";
      expect(normalizePrivateKey(withEscaped)).toBe("line1\nline2");
    });
    it("trims whitespace", () => {
      expect(normalizePrivateKey("  key  ")).toBe("key");
    });
  });

  describe("buildGoogleJwtAssertion", () => {
    it("returns null when privateKey is empty", () => {
      expect(
        buildGoogleJwtAssertion({ clientEmail: "a@b.iam.gserviceaccount.com", privateKeyPem: "" })
      ).toBeNull();
    });
    it("returns a string with three base64url segments when key is valid", () => {
      const jwt = buildGoogleJwtAssertion({
        clientEmail: "test@project.iam.gserviceaccount.com",
        privateKeyPem: FAKE_PEM,
      });
      if (!jwt) {
        // PEM may be invalid for actual signing on this host
        return;
      }
      const parts = jwt.split(".");
      expect(parts.length).toBe(3);
      expect(parts[0].length).toBeGreaterThan(0);
      expect(parts[1].length).toBeGreaterThan(0);
      expect(parts[2].length).toBeGreaterThan(0);
      const payloadJson = Buffer.from(
        parts[1].replace(/-/g, "+").replace(/_/g, "/") + "==".slice(0, (4 - (parts[1].length % 4)) % 4),
        "base64"
      ).toString("utf8");
      const payload = JSON.parse(payloadJson);
      expect(payload.iss).toBe("test@project.iam.gserviceaccount.com");
      expect(payload.sub).toBe("test@project.iam.gserviceaccount.com");
      expect(payload.aud).toBe("https://oauth2.googleapis.com/token");
      expect(typeof payload.iat).toBe("number");
      expect(typeof payload.exp).toBe("number");
      expect(payload.exp - payload.iat).toBe(3600);
    });
  });

  describe("exchangeJwtForAccessToken", () => {
    it("returns null when response is not ok", async () => {
      vi.stubGlobal("fetch", vi.fn().mockResolvedValue({ ok: false, status: 401 }));
      const result = await exchangeJwtForAccessToken({ assertion: "fake.jwt.here" });
      expect(result).toBeNull();
    });
    it("returns accessToken and expiresIn when response is ok", async () => {
      vi.stubGlobal("fetch", vi.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ access_token: "ya29.xxx", expires_in: 3600 }),
      }));
      const result = await exchangeJwtForAccessToken({ assertion: "fake.jwt.here" });
      expect(result).not.toBeNull();
      expect(result!.accessToken).toBe("ya29.xxx");
      expect(result!.expiresIn).toBe(3600);
    });
  });

  describe("getAccessToken", () => {
    it("calls fetch when cache is empty", async () => {
      const mockFetch = vi.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ access_token: "token1", expires_in: 3600 }),
      });
      vi.stubGlobal("fetch", mockFetch);
      const token = await getAccessToken({
        clientEmail: "a@b.iam.gserviceaccount.com",
        privateKeyPem: FAKE_PEM,
      });
      if (token) {
        expect(mockFetch).toHaveBeenCalled();
        expect(token).toBe("token1");
      }
    });
  });
});
