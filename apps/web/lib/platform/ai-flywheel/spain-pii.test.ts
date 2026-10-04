/**
 * Spain / EU construction PII edge-case corpus.
 * See docs/ai-flywheel/SPAIN_PII_EDGE_CASES_REPORT.md
 */
import { describe, expect, it } from "vitest";
import { scrubText, PII_PLACEHOLDERS } from "./pii-scrub";
import { verifyScrubbedText } from "./pii-scrub-verifier";

const SPAIN_CORPUS = {
  nie: "Trabajador NIE X1234567L en obra",
  nif: "NIF 12345678Z del cliente",
  cif: "Empresa con CIF B12345678",
  iban: "Pago a ES91 2100 0418 4502 0005 1332",
  mobile34: "Llame +34 612 345 678",
  mobileLocal: "Móvil 600 000 000",
  landline: "Teléfono 93 000 00 00",
  email: "Contacto obra@example.com",
  cadastral: "Ref catastro 1234567AB1234D",
  calle: "Obra en Calle Mayor 12, Madrid",
  carrer: "Dirección Carrer de la Pau 5, Barcelona",
  av: "Visita Av. Diagonal 100",
  passeig: "Entrega Passeig de Gràcia 50",
  plaza: "Plaza España 3",
  postal: "CP 08001 Barcelona",
  company: "Contratista Obra Norte S.L.U.",
  autonomo: "Autónomo Juan Pérez registrado",
  whatsapp: "WhatsApp @obra_manager",
  telegram: "Telegram t.me/obra_chat",
  bankCard: "Tarjeta 4532 1488 0343 6467",
};

describe("Spain PII edge cases", () => {
  for (const [key, sample] of Object.entries(SPAIN_CORPUS)) {
    it(`scrubs ${key} without raw identifier in output`, () => {
      const r = scrubText(sample);
      expect(r.scrubbed).toBe(true);
      expect(verifyScrubbedText(r.text).passed).toBe(true);
      // Raw email/iban/mobile should not remain
      if (key === "email") expect(r.text).not.toContain("obra@example.com");
      if (key === "iban") expect(r.text).not.toContain("ES91");
      if (key === "mobile34") expect(r.text).not.toMatch(/612\s*345\s*678/);
      if (key === "nie") expect(r.text).not.toMatch(/X1234567L/i);
    });
  }

  it("uses placeholder tokens", () => {
    const r = scrubText(SPAIN_CORPUS.email);
    expect(r.text).toContain(PII_PLACEHOLDERS.EMAIL);
  });

  it("verifier fails deliberately broken scrub", () => {
    expect(verifyScrubbedText(SPAIN_CORPUS.email).passed).toBe(false);
  });

  it("false-positive guard: generic project code without PII passes", () => {
    const text = "Milestone M-104 completed on schedule for project phase 2";
    const r = scrubText(text);
    expect(verifyScrubbedText(r.text).passed).toBe(true);
  });
});
