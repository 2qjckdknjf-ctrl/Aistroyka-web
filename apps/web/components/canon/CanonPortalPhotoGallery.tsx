"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useTranslations } from "next-intl";
import { fetchPublishedPortalPhotos, PortalPhotosError } from "./portal-published-evidence";

export function CanonPortalPhotoGallery({ projectId }: { projectId: string }) {
  const t = useTranslations("canon");
  const common = useTranslations("common");
  const [failedIds, setFailedIds] = useState<string[]>([]);
  const mediaQuery = useQuery({
    queryKey: ["portal-published-photos", projectId],
    queryFn: ({ signal }) => fetchPublishedPortalPhotos(projectId, signal),
    enabled: !!projectId,
    staleTime: 0,
    gcTime: 0,
    retry: false,
    refetchOnWindowFocus: "always",
    refetchInterval: 30_000,
  });

  // React Query retains the previous success on refetch failure. Never display
  // those photos after access denial or an unverified current read.
  const items = mediaQuery.isError ? [] : (mediaQuery.data ?? []);
  if (mediaQuery.isPending) {
    return (
      <section className="canon-glass p-4">
        <h3 className="font-semibold text-[var(--canon-text-primary)]">{t("portalPhotoGallery")}</h3>
        <p className="mt-2 text-sm text-[var(--canon-text-muted)]">{t("loading")}</p>
      </section>
    );
  }

  return (
    <section className="canon-glass p-4" aria-busy={mediaQuery.isFetching}>
      <h3 className="font-semibold text-[var(--canon-text-primary)]">{t("portalPhotoGallery")}</h3>
      {mediaQuery.isError ? (
        <div className="mt-3 space-y-2" role="status">
          <p className="text-sm text-[var(--canon-text-muted)]">
            {t(mediaQuery.error instanceof PortalPhotosError && [401, 403, 404].includes(mediaQuery.error.status)
              ? "portalPhotosAccessUnavailable" : "portalPhotosLoadError")}
          </p>
          <button type="button" className="canon-ghost-btn !text-xs" onClick={() => void mediaQuery.refetch()}>
            {common("retry")}
          </button>
        </div>
      ) : items.length === 0 ? (
        <p className="mt-3 text-sm text-[var(--canon-text-muted)]">{t("portalPhotosEmpty")}</p>
      ) : <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-3">
        {items.map((m) => (
          failedIds.includes(m.id) ? <div key={m.id} className="rounded-lg border border-[var(--canon-border-glass)] p-3">
            <p className="text-sm text-[var(--canon-text-muted)]">{t("portalPhotosOriginalUnavailable")}</p>
            <button type="button" className="canon-ghost-btn mt-2 !text-xs" onClick={() => {
              setFailedIds(ids => ids.filter(id => id !== m.id));
              void mediaQuery.refetch();
            }}>{common("retry")}</button>
          </div> : <a
            key={m.id}
            href={m.original_url}
            target="_blank"
            rel="noopener noreferrer"
            className="overflow-hidden rounded-lg border border-[var(--canon-border-glass)]"
            aria-label={m.zone_label ?? t("portalPhotoGallery")}
          >
            {/* Authenticated originals must avoid the shared image optimizer/cache. */}
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={m.original_url} alt={m.zone_label ?? t("portalPhotoGallery")} loading="lazy"
              className="aspect-square w-full object-cover" onError={(event) => {
                event.currentTarget.hidden = true;
                setFailedIds(ids => ids.includes(m.id) ? ids : [...ids, m.id]);
                void mediaQuery.refetch();
              }} />
            <span className="block p-2 text-xs text-[var(--canon-text-secondary)]">{t("portalPhotosVerified")}</span>
          </a>
        ))}
      </div>}
    </section>
  );
}
