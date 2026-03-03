/**
 * In-memory lock to prevent duplicate "trigger analysis" requests (e.g. double click).
 * Key: projectId:mediaId. Reset on terminal state / error (caller must release).
 */

const lockKeys = new Set<string>();

function key(projectId: string, mediaId: string): string {
  return `${projectId}:${mediaId}`;
}

export function acquireTriggerLock(projectId: string, mediaId: string): boolean {
  const k = key(projectId, mediaId);
  if (lockKeys.has(k)) return false;
  lockKeys.add(k);
  return true;
}

export function releaseTriggerLock(projectId: string, mediaId: string): void {
  lockKeys.delete(key(projectId, mediaId));
}
