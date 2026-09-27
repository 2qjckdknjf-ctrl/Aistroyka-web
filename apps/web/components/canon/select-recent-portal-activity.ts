export type PortalActivityStamp = {
  occurredAt: string;
};

/** Newest activity first. Event type does not change which rows are eligible. */
export function selectRecentPortalActivity<T extends PortalActivityStamp>(
  items: readonly T[],
  limit = 8,
): T[] {
  return [...items]
    .sort((a, b) => {
      if (a.occurredAt === b.occurredAt) return 0;
      return a.occurredAt < b.occurredAt ? 1 : -1;
    })
    .slice(0, limit);
}
