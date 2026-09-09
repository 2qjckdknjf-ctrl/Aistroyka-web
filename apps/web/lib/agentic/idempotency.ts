/**
 * Canonical project-scoped route key for HTTP idempotency of POST /agent.
 */

export function agentIdempotencyRoute(projectId: string): string {
  return `POST /api/v1/projects/${projectId}/agent`;
}
