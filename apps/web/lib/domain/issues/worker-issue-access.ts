/** Worker PATCH is limited to the reporter or the assigned worker on the linked task. */
export function workerMayMutateIssue(input: {
  userId: string | null | undefined;
  createdBy: string | null | undefined;
  assignedTo: string | null | undefined;
}): boolean {
  const userId = input.userId?.trim();
  if (!userId) return false;
  return input.createdBy === userId || input.assignedTo === userId;
}
