"use client";

import { useEffect, useState } from "react";
import { GlassLink } from "@/components/design/liquid-glass";
import { ErrorState } from "@/components/ui/ErrorState";

const IS_DEV =
  typeof process !== "undefined" && process.env.NODE_ENV !== "production";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const [requestIdFromUrl, setRequestIdFromUrl] = useState<string | null>(null);

  useEffect(() => {
    if (!IS_DEV || typeof window === "undefined") return;
    const params = new URLSearchParams(window.location.search);
    const rid = params.get("request_id");
    if (rid) setRequestIdFromUrl(rid);
  }, []);

  useEffect(() => {
    if (IS_DEV && typeof window !== "undefined" && error?.message)
      console.error("[Error boundary]", error.message, error.digest ?? "", error);
  }, [error]);

  const message = (() => {
    const detail = error?.message?.trim() ?? "";
    const isAuthRelated =
      /auth|session|401|403|unauthorized|forbidden|tenant|membership/i.test(detail);
    if (IS_DEV) {
      if (requestIdFromUrl) return `Something went wrong. Request ID: ${requestIdFromUrl}`;
      return detail
        ? `Error: ${detail}${error?.digest ? ` (digest: ${error.digest})` : ""}`
        : "We couldn't complete your request. Please try again.";
    }
    if (isAuthRelated && detail.length > 0 && detail.length < 120) {
      return detail;
    }
    if (isAuthRelated) {
      return "Session invalid or expired. Please log in again.";
    }
    return "We couldn't complete your request. Please try again.";
  })();

  const isAuthRelated =
    /auth|session|401|403|unauthorized|forbidden|tenant|membership/i.test(
      error?.message?.trim() ?? ""
    );
  const loginHref = "/login";

  return (
    <div className="flex min-h-[50vh] flex-col items-center justify-center gap-5 px-4">
      <div className="card-elevated w-full max-w-lg text-center">
        <ErrorState message={message} onRetry={reset} />
        <div className="mt-6 flex flex-wrap justify-center gap-3">
          {isAuthRelated && (
            <GlassLink href={loginHref}>Log in again</GlassLink>
          )}
          <GlassLink href="/" intensity="subtle">
            Go home
          </GlassLink>
        </div>
      </div>
    </div>
  );
}
