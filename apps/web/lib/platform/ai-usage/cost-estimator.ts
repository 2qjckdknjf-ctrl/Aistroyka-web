const PRICE_PER_1K: Record<string, { in: number; out: number }> = {
  "gpt-4o": { in: 0.0025, out: 0.01 },
  "gpt-4o-mini": { in: 0.00015, out: 0.0006 },
};
export function estimateCostUsd(model: string, tokensInput: number, tokensOutput: number): number {
  const p = PRICE_PER_1K[model] ?? PRICE_PER_1K["gpt-4o"];
  return (tokensInput / 1000) * p.in + (tokensOutput / 1000) * p.out;
}
