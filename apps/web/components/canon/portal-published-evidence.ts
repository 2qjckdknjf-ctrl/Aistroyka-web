export type PortalPhoto = {
  id: string;
  zone_label: string | null;
  original_url: string;
  manager_verified: true;
};

export class PortalPhotosError extends Error {
  constructor(public status: number) { super("Published photos unavailable"); }
}

/** Keep every original on the authenticated project gateway. */
export async function fetchPublishedPortalPhotos(projectId: string, signal?: AbortSignal): Promise<PortalPhoto[]> {
  const root = `/api/v1/portal/projects/${encodeURIComponent(projectId)}/evidence`;
  const response = await fetch(root, { credentials: "include", cache: "no-store", signal });
  if (!response.ok) throw new PortalPhotosError(response.status);
  const body = await response.json();
  if (body?.data?.project?.id !== projectId || !Array.isArray(body?.data?.items)) {
    throw new PortalPhotosError(503);
  }
  return body.data.items.map((item: PortalPhoto) => {
    if (typeof item.id !== "string" || !/^[0-9a-f-]{36}$/.test(item.id)
      || item.manager_verified !== true
      || (item.zone_label !== null && typeof item.zone_label !== "string")
      || item.original_url !== `${root}/${item.id}/original`) {
      throw new PortalPhotosError(503);
    }
    return { id: item.id, zone_label: item.zone_label, original_url: item.original_url, manager_verified: true };
  });
}
