const PRICE_PER_1K: Record<string, { in: number; out: number }> = {
  "gpt-4o": { in: 0.0025, out: 0.01 },
  "gpt-4o-mini": { in: 0.00015, out: 0.0006 },
  "claude-sonnet-4-20250514": { in: 0.003, out: 0.015 },
  "claude-3-5-sonnet-20241022": { in: 0.003, out: 0.015 },
  "claude-3-5-haiku": { in: 0.0008, out: 0.004 },
  "gemini-1.5-flash": { in: 0.000075, out: 0.0003 },
  "gemini-1.5-pro": { in: 0.00125, out: 0.005 },
};

function getPricePer1k(model: string): { in: number; out: number } {
  if (PRICE_PER_1K[model]) return PRICE_PER_1K[model];
  if (model.startsWith("claude-")) return PRICE_PER_1K["claude-3-5-sonnet-20241022"];
  if (model.startsWith("gemini-")) return PRICE_PER_1K["gemini-1.5-flash"];
  return PRICE_PER_1K["gpt-4o"];
}

export function estimateCostUsd(model: string, tokensInput: number, tokensOutput: number): number {
  const p = getPricePer1k(model);
  return (tokensInput / 1000) * p.in + (tokensOutput / 1000) * p.out;
}
