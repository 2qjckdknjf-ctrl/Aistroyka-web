/**
 * Dashboard field-daily-log form payload.
 * Confirm must persist this body first: confirmed rows cannot be edited.
 */

export interface FieldDailyLogFormValues {
  workDate: string;
  note: string;
  summary: string;
  workDone: string;
  blockers: string;
  weather: string;
  mediaRef: string;
}

export interface FieldDailyLogDraftBody {
  work_date: string;
  note: string;
  summary: string;
  work_done: string;
  blockers: string;
  weather: string;
  media_refs: string[];
}

/** The form edits media slot 0. Additional refs are not shown and must survive save/confirm. */
export function fieldDailyLogMediaRefsForSave(
  mediaRef: string,
  existingMediaRefs: readonly string[] | null | undefined
): string[] {
  const first = mediaRef.trim();
  const rest = (existingMediaRefs ?? [])
    .slice(1)
    .filter((ref): ref is string => typeof ref === "string" && ref.trim().length > 0)
    .map((ref) => ref.trim());
  return first ? [first, ...rest] : rest;
}

export function fieldDailyLogDraftBody(
  values: FieldDailyLogFormValues,
  existingMediaRefs?: readonly string[] | null
): FieldDailyLogDraftBody {
  return {
    work_date: values.workDate,
    note: values.note,
    summary: values.summary,
    work_done: values.workDone,
    blockers: values.blockers,
    weather: values.weather,
    media_refs: fieldDailyLogMediaRefsForSave(values.mediaRef, existingMediaRefs),
  };
}

type FetchLike = (input: string, init?: RequestInit) => Promise<Response>;

/**
 * Write the visible draft, then confirm. A failed save must not confirm,
 * because confirm locks the previously stored text.
 */
export async function persistThenConfirmFieldDailyLog(
  fetchImpl: FetchLike,
  projectId: string,
  logId: string,
  values: FieldDailyLogFormValues,
  existingMediaRefs?: readonly string[] | null
): Promise<{ ok: true } | { ok: false; error: string }> {
  const saveRes = await fetchImpl(`/api/v1/projects/${projectId}/field-daily-logs/${logId}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify(fieldDailyLogDraftBody(values, existingMediaRefs)),
  });
  const saveJson = (await saveRes.json().catch(() => ({}))) as { error?: string };
  if (!saveRes.ok) {
    return { ok: false, error: typeof saveJson.error === "string" ? saveJson.error : "" };
  }

  const confirmRes = await fetchImpl(
    `/api/v1/projects/${projectId}/field-daily-logs/${logId}/confirm`,
    { method: "POST", credentials: "include" }
  );
  const confirmJson = (await confirmRes.json().catch(() => ({}))) as { error?: string };
  if (!confirmRes.ok) {
    return { ok: false, error: typeof confirmJson.error === "string" ? confirmJson.error : "" };
  }
  return { ok: true };
}
