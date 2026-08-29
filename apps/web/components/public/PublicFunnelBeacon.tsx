"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";
import { funnelEventForPath } from "@/lib/growth/funnel-events";
import { trackGrowthEvent } from "@/lib/growth/track-event";

export function PublicFunnelBeacon({ locale, pathname }: { locale: string; pathname: string }) {
  const clientPath = usePathname();
  const path = clientPath || pathname;
  useEffect(() => {
    const name = funnelEventForPath(path);
    if (!name) {
      return;
    }
    void trackGrowthEvent(name, { page: path, locale });
  }, [locale, path]);
  return <span hidden data-growth-os-funnel="public" />;
}
