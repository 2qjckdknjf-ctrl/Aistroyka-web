import { describe, expect, it } from "vitest";
import { scrubText, scrubJsonStrings } from "./pii-scrub";
import { verifyScrubbedText, scrubAndVerify } from "./pii-scrub-verifier";

const CORPUS = {
  email: "Contact user@example.com for update",
  phone: "Call +34 612 345 678 today",
  iban: "Transfer to ES91 2100 0418 4502 0005 1332 please",
  bank: "Card 4532 1488 0343 6467 expired",
  address: "Visit Calle Mayor 12 Madrid for inspection",
  nif: "NIF B12345678 registered",
};

describe("pii scrub", () => {
  it("scrubs email", () => {
    const r = scrubText(CORPUS.email);
    expect(r.text).not.toContain("user@example.com");
    expect(r.typesFound).toContain("EMAIL");
    expect(r.text).toContain("{EMAIL}");
  });

  it("scrubs phone", () => {
    const r = scrubText(CORPUS.phone);
    expect(r.text).not.toMatch(/612\s*345\s*678/);
    expect(r.typesFound).toContain("PHONE");
  });

  it("scrubs IBAN", () => {
    const r = scrubText(CORPUS.iban);
    expect(r.text).not.toContain("ES91");
    expect(r.typesFound).toContain("BANK_DETAIL");
  });

  it("scrubs bank card", () => {
    const r = scrubText(CORPUS.bank);
    expect(r.text).not.toContain("4532");
    expect(r.typesFound).toContain("BANK_DETAIL");
  });

  it("scrubs address patterns", () => {
    const r = scrubText(CORPUS.address);
    expect(r.scrubbed).toBe(true);
    expect(r.typesFound).toContain("ADDRESS");
  });

  it("scrubs JSON string values", () => {
    const r = scrubJsonStrings({ msg: CORPUS.email, nested: { phone: CORPUS.phone } });
    const json = JSON.stringify(r.value);
    expect(json).not.toContain("user@example.com");
    expect(r.scrubbed).toBe(true);
  });
});

describe("pii scrub verifier", () => {
  it("passes clean text", () => {
    expect(verifyScrubbedText("Schedule milestone review").passed).toBe(true);
  });

  it("catches deliberately unsanitized email", () => {
    expect(verifyScrubbedText(CORPUS.email).passed).toBe(false);
  });

  it("scrubAndVerify passes after scrub", () => {
    const ok = scrubAndVerify("Hello team");
    expect(ok).not.toBeNull();
    const scrubbed = scrubAndVerify(CORPUS.email);
    expect(scrubbed).not.toBeNull();
    expect(scrubbed!.text).not.toContain("user@example.com");
  });

  it("verifier catches unsanitized output", () => {
    expect(verifyScrubbedText("Still has user@example.com").passed).toBe(false);
  });
});
