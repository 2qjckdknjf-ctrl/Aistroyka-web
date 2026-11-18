/** Deterministic visual for project cards (gradient only — no fake photo URLs). */
export function getCanonProjectGradient(projectId: string): string {
  let hash = 0;
  for (let i = 0; i < projectId.length; i++) {
    hash = (hash << 5) - hash + projectId.charCodeAt(i);
    hash |= 0;
  }
  const hue = Math.abs(hash) % 360;
  const hue2 = (hue + 40) % 360;
  return `linear-gradient(145deg, hsl(${hue} 45% 12%) 0%, hsl(${hue2} 55% 22%) 45%, hsl(${hue} 35% 8%) 100%)`;
}
