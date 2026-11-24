/**
 * Synthetic catalog / supplier-text safety for AIS-MATERIAL-008 draft compare.
 * Flags prompt-injection and control-character patterns. Does not contact suppliers.
 */

const UNSAFE_PATTERNS: readonly RegExp[] = [
  /<\s*script\b/i,
  /\bon\w+\s*=/i,
  /ignore\s+(all\s+)?(previous|prior|above)\s+instructions/i,
  /system\s*:\s*/i,
  /\bDAN\b/,
  /```[\s\S]*?```/,
  /[\u0000-\u0008\u000B\u000C\u000E-\u001F]/,
];

export function findUnsafeCatalogText(...parts: Array<string | null | undefined>): string | null {
  for (const part of parts) {
    if (!part) continue;
    const text = part.trim();
    if (!text) continue;
    for (const pattern of UNSAFE_PATTERNS) {
      if (pattern.test(text)) return text.slice(0, 120);
    }
  }
  return null;
}

export function catalogTextIsUnsafe(...parts: Array<string | null | undefined>): boolean {
  return findUnsafeCatalogText(...parts) !== null;
}
