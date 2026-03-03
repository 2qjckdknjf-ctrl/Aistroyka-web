# Data & State Layer P1 — TanStack Query

**Scope:** Web app only. Backend unchanged. P0 Perfect UX preserved.

---

## Overview

TanStack Query (React Query) is the single data/state layer for server state: cache, retries, and loading/error/empty are centralized. Components use hooks (`useProjects`, `useProject`, `useMutation` for AI) instead of ad-hoc `fetch` + `useState`.

---

## Cache and retry policy

Configured in `lib/query/queryClient.ts`:

- **staleTime:** 30s — data is fresh for 30s before background refetch is considered.
- **gcTime:** 10m — unused cache entries are garbage-collected after 10 minutes.
- **retry:** 2 attempts for most errors; **no retry** for 401, 403, 404 (so login/forbidden/not-found don’t spin).
- **refetchOnWindowFocus:** false.
- **refetchOnReconnect:** true.
- **throwOnError:** false — errors are exposed via `isError` / `error`, not thrown to boundary by default.

Errors with a `status` property (e.g. from `normalizeToQueryError`) are used by the retry logic so 401/403/404 skip retries.

---

## Query keys

Defined in `lib/engine/queryKeys.ts` (used by hooks; prefer hooks over raw keys):

| Key | Usage |
|-----|--------|
| `["projects"]` | List of projects (current user tenant). |
| `["project", projectId]` | Single project details. |
| `["ai", "summary", projectId]` | AI summary (stub for P2). |
| `["ai", "explain", projectId]` | AI explain (stub for P2). |
| `["ai", "history", projectId]` | AI history (stub for P2). |

---

## Adding new queries

1. Add the key in `queryKeys.ts` if needed.
2. Create a fetcher (e.g. `fetchX`) that calls your API and throws an error with `status` for 4xx/5xx so retry policy applies.
3. Create a hook in `lib/` or `lib/projects/` that uses `useQuery({ queryKey, queryFn, enabled })`.
4. Use the hook in components; wrap with `QueryBoundary` for loading/error/empty if it’s a full block.

**Do not** call `fetch` directly in components for server state — use a hook that uses `useQuery`.

---

## Adding new mutations

1. Use `useMutation` with a `mutationFn` that returns the result (or throws).
2. For engine/AI errors, throw `normalizeToQueryError(engineError)` so UI can use `getEngineError(error)` and show `AiErrorBanner`.
3. Use `onMutate` / `onSuccess` / `onError` for local state (e.g. clearing form, showing request_id).

---

## Engine error normalization

- **normalizeToQueryError(engineError)** — turns `EngineError` into an `Error` with `status` and `engineError` so React Query retry and UI can use it.
- **getEngineError(error)** — returns `EngineError` from a thrown/rejected value when present.
- `QueryBoundary` and `mapQueryErrorToUI` use this so engine messages and banners stay consistent.

---

## Best practices

- Don’t fetch server state in components with raw `fetch` + `useState` — use `useQuery`/hooks.
- Use `QueryBoundary` for list/detail blocks so loading/error/empty are consistent.
- Prefetch on navigation when it helps (e.g. `usePrefetchProject` on link hover).
- Keep request_id authoritative (P0): engine client and mutations keep using it; no change in P1.

---

## Files

- `lib/query/queryClient.ts` — `QueryClient` factory and defaults.
- `lib/query/QueryProvider.tsx` — `QueryClientProvider` + DevTools (dev/staging).
- `lib/query/render.tsx` — `QueryBoundary`, `mapQueryErrorToUI`.
- `lib/engine/queryKeys.ts` — query key constants.
- `lib/engine/normalizeError.ts` — `normalizeToQueryError`, `getEngineError`.
- `lib/projects/useProjects.ts` — `useProjects()`.
- `lib/projects/useProject.ts` — `useProject(projectId)`.
- `lib/projects/prefetchProject.ts` — `usePrefetchProject()` for link hover.
