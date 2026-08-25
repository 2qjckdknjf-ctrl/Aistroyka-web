"use client";

import { useQuery } from "@tanstack/react-query";
import { useTranslations } from "next-intl";
import { fetchProjectMedia } from "@/components/canon/canon-live-data";

export function CanonPortalPhotoGallery({ projectId }: { projectId: string }) {
  const t = useTranslations("canon");
  const mediaQuery = useQuery({
    queryKey: ["portal-project-media", projectId],
    queryFn: () => fetchProjectMedia(projectId, 9),
    staleTime: 60_000,
  });

  const items = (mediaQuery.data ?? []).filter((m) => m.file_url);
  if (mediaQuery.isPending) {
    return (
      <section className="canon-glass p-4">
        <h3 className="font-semibold text-[var(--canon-text-primary)]">{t("portalPhotoGallery")}</h3>
        <p className="mt-2 text-sm text-[var(--canon-text-muted)]">{t("loading")}</p>
      </section>
    );
  }

  if (items.length === 0) return null;

  return (
    <section className="canon-glass p-4">
      <h3 className="font-semibold text-[var(--canon-text-primary)]">{t("portalPhotoGallery")}</h3>
      <div className="mt-3 grid grid-cols-3 gap-2 sm:grid-cols-4">
        {items.map((m) => (
          <a
            key={m.id}
            href={m.file_url}
            target="_blank"
            rel="noopener noreferrer"
            className="aspect-square overflow-hidden rounded-lg border border-[var(--canon-border-glass)]"
          >
            <img src={m.file_url} alt="" className="h-full w-full object-cover" />
          </a>
        ))}
      </div>
    </section>
  );
}
