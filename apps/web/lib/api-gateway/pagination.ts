/**
 * API gateway — pagination pattern (cursor and offset).
 */

export interface CursorPaginationParams {
  cursor?: string | null;
  limit?: number;
}

export interface CursorPaginationMeta {
  nextCursor: string | null;
  hasMore: boolean;
  limit: number;
}

export interface OffsetPaginationParams {
  offset?: number;
  limit?: number;
}

export const DEFAULT_PAGE_LIMIT = 20;
export const MAX_PAGE_LIMIT = 100;

export function normalizeLimit(limit: unknown): number {
  const n = typeof limit === "string" ? parseInt(limit, 10) : Number(limit);
  if (!Number.isFinite(n) || n < 1) return DEFAULT_PAGE_LIMIT;
  return Math.min(n, MAX_PAGE_LIMIT);
}

export function normalizeOffset(offset: unknown): number {
  const n = typeof offset === "string" ? parseInt(offset, 10) : Number(offset);
  if (!Number.isFinite(n) || n < 0) return 0;
  return n;
}

export function parseCursorPagination(request: Request): CursorPaginationParams {
  const url = new URL(request.url);
  return {
    cursor: url.searchParams.get("cursor") ?? undefined,
    limit: normalizeLimit(url.searchParams.get("limit")),
  };
}

export function parseOffsetPagination(request: Request): OffsetPaginationParams {
  const url = new URL(request.url);
  return {
    offset: normalizeOffset(url.searchParams.get("offset")),
    limit: normalizeLimit(url.searchParams.get("limit")),
  };
}
