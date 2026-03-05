/**
 * Heuristic PII classifier. No heavy NLP; regex and patterns for EMAIL, PHONE, etc.
 */

import type { PiiClassification, PiiType } from "./pii.types";

const EMAIL_RE = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g;
const PHONE_RE = /\+?[\d\s\-()]{10,}/g;
const ADDRESS_RE = /\d+\s+[\w\s]+(?:street|st|avenue|ave|road|rd|boulevard|blvd|drive|dr|lane|ln)/gi;
const PERSON_NAME_RE = /(?:Mr|Mrs|Ms|Dr)\.\s*[A-Z][a-z]+(?:\s+[A-Z][a-z]+)+/g;
const ID_NUMBER_RE = /\b\d{4}[\s-]?\d{4}[\s-]?\d{4}[\s-]?\d{4}\b/g;

export function classifyText(text: string): PiiClassification {
  const types: PiiType[] = [];
  if (text.match(EMAIL_RE)) types.push("EMAIL");
  if (text.match(PHONE_RE)) types.push("PHONE");
  if (text.match(ADDRESS_RE)) types.push("ADDRESS");
  if (text.match(PERSON_NAME_RE)) types.push("PERSON_NAME");
  if (text.match(ID_NUMBER_RE)) types.push("ID_NUMBER");

  let pii_level: PiiClassification["pii_level"] = "none";
  if (types.length > 0) {
    if (types.includes("ID_NUMBER") || types.includes("ADDRESS")) pii_level = "high";
    else if (types.includes("EMAIL") || types.includes("PHONE")) pii_level = "medium";
    else pii_level = "low";
  }
  return { pii_level, types };
}
