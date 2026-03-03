"use client";

import type { ReactNode } from "react";
import { getEngineError } from "@/lib/engine/normalizeError";
import type { EngineError } from "@/lib/engine/errors";
import { ErrorState } from "@/components/ui/ErrorState";
import { EmptyState } from "@/components/ui/EmptyState";
import { Skeleton } from "@/components/ui/Skeleton";

export interface QueryBoundaryProps<T> {
  /** Result of useQuery (data, isPending, isError, error, refetch). */
  query: {
    data: T | undefined;
    isPending: boolean;
    isError: boolean;
    error: unknown;
    refetch: () => void;
  };
  /** Render children when data is present. Empty array/empty list can be treated as empty. */
  children: (data: T) => ReactNode;
  /** Optional: treat falsy or empty array as empty and show emptyState. */
  emptyCondition?: (data: T) => boolean;
  /** Optional: custom empty message. */
  emptyTitle?: string;
  emptySubtitle?: string;
  /** Optional: action node in empty state (e.g. Create button). */
  emptyAction?: ReactNode;
  /** Optional: loading skeleton. */
  loadingFallback?: ReactNode;
}

/**
 * Single place for loading/error/empty handling so components don't duplicate.
 * Uses EngineError for message when available (mapQueryErrorToUI).
 */
export function QueryBoundary<T>({
  query,
  children,
  emptyCondition = (d) => d == null,
  emptyTitle = "No data",
  emptySubtitle = "",
  emptyAction,
  loadingFallback,
}: QueryBoundaryProps<T>) {
  const { data, isPending, isError, error, refetch } = query;

  if (isPending) {
    return loadingFallback ?? <Skeleton lines={3} className="max-w-md" />;
  }

  if (isError) {
    const { message } = mapQueryErrorToUI(error);
    return <ErrorState message={message} onRetry={() => refetch()} />;
  }

  if (emptyCondition(data as T)) {
    return (
      <EmptyState
        icon={<span className="text-2xl text-aistroyka-text-tertiary">—</span>}
        title={emptyTitle}
        subtitle={emptySubtitle}
        action={emptyAction}
      />
    );
  }

  return <>{children(data as T)}</>;
}

/**
 * Map query error to UI: use EngineError message when present, else generic.
 */
export function mapQueryErrorToUI(error: unknown): {
  message: string;
  engineError: EngineError | null;
} {
  const engineError = getEngineError(error);
  if (engineError) return { message: engineError.message, engineError };
  if (error instanceof Error) return { message: error.message, engineError: null };
  return {
    message: typeof error === "string" ? error : "Something went wrong.",
    engineError: null,
  };
}
