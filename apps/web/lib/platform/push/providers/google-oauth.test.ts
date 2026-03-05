import { describe, expect, it, vi } from "vitest";
import crypto from "crypto";
import {
  buildGoogleJwtAssertion,
  clearGoogleTokenCache,
  getGoogleAccessToken,
  normalizePrivateKey,
} from "./google-oauth";

function generateTestKey(): string {
  const { privateKey } = crypto.generateKeyPairSync("rsa", { modulusLength: 512 });
  return privateKey.export({ type: "pkcs8", format: "pem" }) as string;
}

describe("google-oauth", () => {
  const clientEmail = "fcm@proj.iam.gserviceaccount.com";
  const privateKeyPem = generateTestKey();

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
    it("returns null when clientEmail or privateKey missing", () => {
      expect(buildGoogleJwtAssertion({ clientEmail: "", privateKeyPem })).toBeNull();
      expect(buildGoogleJwtAssertion({ clientEmail, privateKeyPem: "" })).toBeNull();
    });

    it("returns a three-part JWT string when key is valid", () => {
      const jwt = buildGoogleJwtAssertion({ clientEmail, privateKeyPem });
      expect(jwt).not.toBeNull();
      const parts = (jwt as string).split(".");
      expect(parts).toHaveLength(3);
      const payload = JSON.parse(
        Buffer.from(parts[1]!.replace(/-/g, "+").replace(/_/g, "/"), "base64"
        ).toString("utf8")
      );
      expect(payload.iss).toBe(clientEmail);
      expect(payload.sub).toBe(clientEmail);
      expect(payload.aud).toBe("https://oauth2.googleapis.com/token");
      expect(typeof payload.iat).toBe("number");
      expect(payload.exp).toBe(payload.iat + 3600);
    });

    it("uses custom tokenUri in aud when provided", () => {
      const customUri = "https://custom.token.url/token";
      const jwt = buildGoogleJwtAssertion({
        clientEmail,
        privateKeyPem,
        tokenUri: customUri,
      });
      expect(jwt).not.toBeNull();
      const parts = (jwt as string).split(".");
      const payload = JSON.parse(
        Buffer.from(parts[1]!.replace(/-/g, "+").replace(/_/g, "/"), "base64")
          .toString("utf8")
      );
      expect(payload.aud).toBe(customUri);
    });
  });

  describe("getGoogleAccessToken", () => {
    it("returns null when fetch fails", async () => {
      clearGoogleTokenCache();
      const res = await getGoogleAccessToken({
        clientEmail,
        privateKeyPem,
        fetchFn: () => Promise.resolve(new Response("bad", { status: 400 })),
      });
      expect(res).toBeNull();
    });

    it("returns access token when fetch returns 200 with access_token", async () => {
      clearGoogleTokenCache();
      const token = "ya29.test-token";
      const res = await getGoogleAccessToken({
        clientEmail,
        privateKeyPem,
        fetchFn: () =>
          Promise.resolve(
            new Response(
              JSON.stringify({ access_token: token, expires_in: 3600 }),
              { status: 200 }
            )
          ),
      });
      expect(res).toBe(token);
    });

    it("caches token and returns same on second call without fetch", async () => {
      clearGoogleTokenCache();
      let fetchCount = 0;
      const token = "cached-token";
      const fetchFn = () => {
        fetchCount++;
        return Promise.resolve(
          new Response(
            JSON.stringify({ access_token: token, expires_in: 3600 }),
            { status: 200 }
          )
        );
      };
      const first = await getGoogleAccessToken({
        clientEmail,
        privateKeyPem,
        fetchFn,
      });
      const second = await getGoogleAccessToken({
        clientEmail,
        privateKeyPem,
        fetchFn,
      });
      expect(first).toBe(token);
      expect(second).toBe(token);
      expect(fetchCount).toBe(1);
    });
  });
});
