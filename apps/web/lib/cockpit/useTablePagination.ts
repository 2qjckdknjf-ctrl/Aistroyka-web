"use client";

const PAGE_SIZE_MIN = 10;
const PAGE_SIZE_MAX = 100;
const PAGE_SIZE_DEFAULT = 25;

export interface TablePaginationState {
  page: number;
  pageSize: number;
  offset: number;
  limit: number;
}

/**
 * Parse page and pageSize from URL params for offset-based list APIs.
 * Use with useFilterParams: params come from URL; setParam("page", n) for navigation.
 * Filter changes should reset page to 1 (handled by useFilterParams.setParam).
 */
export function parseTablePagination(params: { page?: string; pageSize?: string }): TablePaginationState {
  const page = Math.max(1, parseInt(params.page ?? "1", 10) || 1);
  const pageSize = Math.max(
    PAGE_SIZE_MIN,
    Math.min(PAGE_SIZE_MAX, parseInt(params.pageSize ?? String(PAGE_SIZE_DEFAULT), 10) || PAGE_SIZE_DEFAULT)
  );
  return {
    page,
    pageSize,
    offset: (page - 1) * pageSize,
    limit: pageSize,
  };
}
