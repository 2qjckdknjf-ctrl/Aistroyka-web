"use client";

import { useEffect } from "react";
import { funnelEventForPath } from "@/lib/growth/funnel-events";
import { trackGrowthEvent } from "@/lib/growth/track-event";

export function PublicFunnelBeacon({ locale, pathname }: { locale: string; pathname: string }) {
  useEffect(() => {
    const name = funnelEventForPath(pathname);
    if (!name) {
      return;
    }
    void trackGrowthEvent(name, { page: pathname, locale });
  }, [locale, pathname]);
  return <span hidden data-growth-os-funnel="public" />;
}
