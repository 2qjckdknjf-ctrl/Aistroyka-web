/**
 * PII scrub foundation for dataset export. Heuristic patterns — not production NLP.
 * Scrub before export; never log raw private data.
 */

export interface ScrubResult {
  text: string;
  scrubbed: boolean;
  typesFound: string[];
}

export const PII_PLACEHOLDERS = {
  EMAIL: "{EMAIL}",
  PHONE: "{PHONE}",
  BANK_DETAIL: "{BANK_DETAIL}",
  ADDRESS: "{ADDRESS}",
  COMPANY: "{COMPANY}",
  TAX_ID: "{TAX_ID}",
  CADASTRAL: "{CADASTRAL}",
  SOCIAL_HANDLE: "{SOCIAL_HANDLE}",
  POSTAL_CODE: "{POSTAL_CODE}",
  NAME: "{NAME}",
} as const;

const EMAIL_RE = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g;
const SPANISH_MOBILE_RE = /(?:\+34[\s.-]?)?(?:[67]\d{2}[\s.-]?\d{3}[\s.-]?\d{3}|\d{3}[\s.-]?\d{2}[\s.-]?\d{2}[\s.-]?\d{2})/g;
const SPANISH_LANDLINE_RE =
  /(?:\+34[\s.-]?)?(?:[89]\d{2}[\s.-]?\d{3}[\s.-]?\d{2}[\s.-]?\d{2}|\d{2}[\s.-]?\d{3}[\s.-]?\d{2}[\s.-]?\d{2})/g;
const AUTONOMO_RE = /\bAut[oó]nomo\b/gi;
const IBAN_RE = /\bES\d{2}[\s]?[0-9]{4}[\s]?[0-9]{4}[\s]?[0-9]{4}[\s]?[0-9]{4}[\s]?[0-9]{4}\b/gi;
const GENERIC_IBAN_RE = /\b[A-Z]{2}\d{2}[\s]?[A-Z0-9]{4}[\s]?[0-9]{4}[\s]?[0-9]{4}[\s]?[0-9]{4}[\s]?[0-9]{0,4}\b/gi;
const BANK_CARD_RE = /\b\d{4}[\s-]?\d{4}[\s-]?\d{4}[\s-]?\d{4}\b/g;
const BANK_ACCOUNT_RE = /\b(?:ES\d{2}[\s-]?)?\d{4}[\s-]?\d{4}[\s-]?\d{2}[\s-]?\d{10}\b/g;
const NIE_RE = /\b[XYZ]\d{7}[A-Z]\b/gi;
const NIF_RE = /\b\d{8}[A-Z]\b/gi;
const CIF_RE = /\b[A-HJ-NP-SUVW]\d{7}[0-9A-J]\b/gi;
const TAX_LABEL_RE = /\b(?:TIN|VAT|NIF|NIE|CIF|DNI)[:\s#-]*[A-Z0-9-]{6,20}\b/gi;
const CADASTRAL_RE = /\b\d{7}[A-Z]{2}\d{4}[A-Z]\b/gi;
const POSTAL_CODE_RE = /\b(?:CP|C\.P\.|código postal)[:\s#-]*\d{5}\b/gi;
const STANDALONE_POSTAL_RE = /\b0\d{4}\b|\b[1-4]\d{4}\b|\b5[0-2]\d{3}\b/g;
const COMPANY_SUFFIX_RE =
  /\b[\w\s&.]{2,40}\s+(?:S\.?L\.?U?\.?|Sociedad Limitada|Autónomo|Autonomo|S\.A\.|SA)\b/gi;
const SOCIAL_HANDLE_RE = /\b(?:whatsapp|telegram|wa\.me|t\.me)[:\s@/]*[@]?[\w.-]{3,32}\b/gi;
const ADDRESS_RE =
  /\b(?:C\/|Calle|Carrer|Av\.?|Avenida|Avinguda|Passeig|Plaza|Plaça|Pg\.?|Camino|Carretera|Rúa|Rua|Via)\s+[\w\s\d,.ºª/-]{3,80}\b/gi;
const STREET_NUMBER_RE =
  /\b\d{1,5}\s+[\w\s]{3,40}(?:street|st|avenue|ave|road|rd|boulevard|blvd|drive|dr|lane|ln|calle|carrer)\b/gi;

const REPLACEMENTS: Array<{ re: RegExp; label: string; replacement: string }> = [
  { re: EMAIL_RE, label: "EMAIL", replacement: PII_PLACEHOLDERS.EMAIL },
  { re: IBAN_RE, label: "BANK_DETAIL", replacement: PII_PLACEHOLDERS.BANK_DETAIL },
  { re: GENERIC_IBAN_RE, label: "BANK_DETAIL", replacement: PII_PLACEHOLDERS.BANK_DETAIL },
  { re: BANK_CARD_RE, label: "BANK_DETAIL", replacement: PII_PLACEHOLDERS.BANK_DETAIL },
  { re: BANK_ACCOUNT_RE, label: "BANK_DETAIL", replacement: PII_PLACEHOLDERS.BANK_DETAIL },
  { re: NIE_RE, label: "TAX_ID", replacement: PII_PLACEHOLDERS.TAX_ID },
  { re: NIF_RE, label: "TAX_ID", replacement: PII_PLACEHOLDERS.TAX_ID },
  { re: CIF_RE, label: "TAX_ID", replacement: PII_PLACEHOLDERS.TAX_ID },
  { re: TAX_LABEL_RE, label: "TAX_ID", replacement: PII_PLACEHOLDERS.TAX_ID },
  { re: CADASTRAL_RE, label: "CADASTRAL", replacement: PII_PLACEHOLDERS.CADASTRAL },
  { re: POSTAL_CODE_RE, label: "POSTAL_CODE", replacement: PII_PLACEHOLDERS.POSTAL_CODE },
  { re: SOCIAL_HANDLE_RE, label: "SOCIAL_HANDLE", replacement: PII_PLACEHOLDERS.SOCIAL_HANDLE },
  { re: SPANISH_MOBILE_RE, label: "PHONE", replacement: PII_PLACEHOLDERS.PHONE },
  { re: SPANISH_LANDLINE_RE, label: "PHONE", replacement: PII_PLACEHOLDERS.PHONE },
  { re: ADDRESS_RE, label: "ADDRESS", replacement: PII_PLACEHOLDERS.ADDRESS },
  { re: STREET_NUMBER_RE, label: "ADDRESS", replacement: PII_PLACEHOLDERS.ADDRESS },
  { re: COMPANY_SUFFIX_RE, label: "COMPANY", replacement: PII_PLACEHOLDERS.COMPANY },
  { re: AUTONOMO_RE, label: "COMPANY", replacement: PII_PLACEHOLDERS.COMPANY },
];

function resetRegex(re: RegExp): void {
  re.lastIndex = 0;
}

function applyReplacement(text: string, re: RegExp, replacement: string): string {
  resetRegex(re);
  return text.replace(re, replacement);
}

/** Scrub known PII patterns from text. */
export function scrubText(text: string): ScrubResult {
  const typesFound: string[] = [];
  let out = text;

  for (const { re, label, replacement } of REPLACEMENTS) {
    resetRegex(re);
    if (re.test(out)) {
      if (!typesFound.includes(label)) typesFound.push(label);
      out = applyReplacement(out, re, replacement);
    }
  }

  // Standalone Spanish postal codes only when near address keywords (reduce false positives)
  if (/\b(?:calle|carrer|madrid|barcelona|valencia|sevilla|bilbao|CP)\b/i.test(out)) {
    resetRegex(STANDALONE_POSTAL_RE);
    if (STANDALONE_POSTAL_RE.test(out)) {
      if (!typesFound.includes("POSTAL_CODE")) typesFound.push("POSTAL_CODE");
      out = applyReplacement(out, STANDALONE_POSTAL_RE, PII_PLACEHOLDERS.POSTAL_CODE);
    }
  }

  return {
    text: out,
    scrubbed: typesFound.length > 0,
    typesFound,
  };
}

/** Scrub string values in JSON recursively. */
export function scrubJsonStrings(value: unknown): { value: unknown; scrubbed: boolean; typesFound: string[] } {
  const allTypes: string[] = [];
  let anyScrubbed = false;

  if (typeof value === "string") {
    const r = scrubText(value);
    return { value: r.text, scrubbed: r.scrubbed, typesFound: r.typesFound };
  }

  if (Array.isArray(value)) {
    const mapped = value.map((item) => {
      const r = scrubJsonStrings(item);
      anyScrubbed = anyScrubbed || r.scrubbed;
      for (const t of r.typesFound) if (!allTypes.includes(t)) allTypes.push(t);
      return r.value;
    });
    return { value: mapped, scrubbed: anyScrubbed, typesFound: allTypes };
  }

  if (value !== null && typeof value === "object") {
    const out: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(value as Record<string, unknown>)) {
      const r = scrubJsonStrings(v);
      anyScrubbed = anyScrubbed || r.scrubbed;
      for (const t of r.typesFound) if (!allTypes.includes(t)) allTypes.push(t);
      out[k] = r.value;
    }
    return { value: out, scrubbed: anyScrubbed, typesFound: allTypes };
  }

  return { value, scrubbed: false, typesFound: [] };
}

/** Apply optional tenant/project dictionary redaction (names only, no logging). */
export function scrubWithDictionary(text: string, terms: string[]): ScrubResult {
  let out = text;
  const typesFound: string[] = [];
  for (const term of terms) {
    const trimmed = term.trim();
    if (trimmed.length < 2) continue;
    const escaped = trimmed.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const re = new RegExp(`\\b${escaped}\\b`, "gi");
    if (re.test(out)) {
      if (!typesFound.includes("NAME")) typesFound.push("NAME");
      re.lastIndex = 0;
      out = out.replace(re, PII_PLACEHOLDERS.NAME);
    }
  }
  const base = scrubText(out);
  for (const t of typesFound) if (!base.typesFound.includes(t)) base.typesFound.push(t);
  return {
    text: base.text,
    scrubbed: base.scrubbed || typesFound.length > 0,
    typesFound: base.typesFound,
  };
}
