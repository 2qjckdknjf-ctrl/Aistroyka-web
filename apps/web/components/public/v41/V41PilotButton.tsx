"use client";

import type { ReactNode } from "react";
import { useParams } from "next/navigation";
import { useV41Pilot } from "./V41PilotContext";
import { trackGrowthEvent } from "@/lib/growth/track-event";

type V41PilotButtonProps = {
  children: ReactNode;
  className?: string;
  testId?: string;
  type?: "button" | "submit";
  plan?: string;
};

export function V41PilotButton({
  children,
  className = "v41-btn v41-btn-primary",
  testId,
  type = "button",
  plan,
}: V41PilotButtonProps) {
  const { open } = useV41Pilot();
  const params = useParams();
  const locale = typeof params.locale === "string" ? params.locale : "unknown";
  return (
    <button
      type={type}
      className={className}
      onClick={() => {
        void trackGrowthEvent("cta.clicked", {
          page: typeof window === "undefined" ? "" : window.location.pathname,
          placement: testId ?? "pilot",
          locale,
        });
        open(plan ? { plan } : undefined);
      }}
      data-testid={testId}
    >
      {children}
    </button>
  );
}
