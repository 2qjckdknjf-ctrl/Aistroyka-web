import { generateKeyPairSync } from "crypto";
import { describe, expect, it, vi } from "vitest";
import {
  buildGoogleJwt,
  clearGoogleTokenCache,
  normalizePrivateKey,
  getGoogleAccessToken,
} from "./google-oauth";

function generateTestPrivateKey(): string {
  const { privateKey } = generateKeyPairSync("rsa", {
    modulusLength: 2048,
    privateKeyEncoding: { type: "pkcs8", format: "pem" },
  });
  return privateKey;
}

describe("google-oauth", () => {
  const clientEmail = "fcm@proj.iam.gserviceaccount.com";
  const tokenUri = "https://oauth2.googleapis.com/token";
  const privateKeyPem = generateTestPrivateKey();

  describe("normalizePrivateKey", () => {
    it("replaces literal \\n with newline", () => {
      const withLiteral = "line1\\nline2";
      expect(normalizePrivateKey(withLiteral)).toBe("line1\nline2");
    });
    it("trims whitespace", () => {
      expect(normalizePrivateKey("  key  ")).toBe("key");
    });
  });

  describe("buildGoogleJwt", () => {
    it("returns null when private key is invalid", () => {
      const jwt = buildGoogleJwt(clientEmail, tokenUri, "not-a-valid-key");
      expect(jwt).toBeNull();
    });

    it("produces three base64url segments when key is valid", () => {
      const jwt = buildGoogleJwt(clientEmail, tokenUri, privateKeyPem);
      expect(jwt).toBeTruthy();
      if (jwt) {
        const parts = jwt.split(".");
        expect(parts).toHaveLength(3);
        expect(parts.every((p) => /^[A-Za-z0-9_-]+$/.test(p))).toBe(true);
      }
    });

    it("payload contains iss, sub, aud, iat, exp", () => {
      const jwt = buildGoogleJwt(clientEmail, tokenUri, privateKeyPem);
      expect(jwt).toBeTruthy();
      if (jwt) {
        const [, payloadB64] = jwt.split(".");
        const payload = JSON.parse(
          Buffer.from(payloadB64, "base64url").toString("utf8")
        ) as Record<string, unknown>;
        expect(payload.iss).toBe(clientEmail);
        expect(payload.sub).toBe(clientEmail);
        expect(payload.aud).toBe(tokenUri);
        expect(typeof payload.iat).toBe("number");
        expect(typeof payload.exp).toBe("number");
        expect((payload.exp as number) - (payload.iat as number)).toBe(3600);
      }
    });
  });

  describe("getGoogleAccessToken", () => {
    it("returns null when env is missing", async () => {
      clearGoogleTokenCache();
      vi.stubEnv("FCM_CLIENT_EMAIL", "");
      vi.stubEnv("FCM_PRIVATE_KEY", "");
      const token = await getGoogleAccessToken();
      expect(token).toBeNull();
    });

    it("exchanges JWT for token when fetch returns 200", async () => {
      clearGoogleTokenCache();
      vi.stubEnv("FCM_CLIENT_EMAIL", clientEmail);
      vi.stubEnv("FCM_PRIVATE_KEY", privateKeyPem);
      vi.stubEnv("FCM_TOKEN_URI", tokenUri);
      const mockToken = "ya29.mock_access_token";
      globalThis.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ access_token: mockToken, expires_in: 3600 }),
      });
      const token = await getGoogleAccessToken();
      expect(token).toBe(mockToken);
      vi.restoreAllMocks();
    });
  });
});
