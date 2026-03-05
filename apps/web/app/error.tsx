"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
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
    if (IS_DEV) {
      if (requestIdFromUrl) return `Something went wrong. Request ID: ${requestIdFromUrl}`;
      const detail = error?.message?.trim();
      return detail
        ? `Error: ${detail}${error?.digest ? ` (digest: ${error.digest})` : ""}`
        : "We couldn't complete your request. Please try again.";
    }
    return "We couldn't complete your request. Please try again.";
  })();

  return (
    <div className="flex min-h-[50vh] flex-col items-center justify-center gap-5 px-4">
      <ErrorState message={message} onRetry={reset} />
      <div className="flex flex-wrap justify-center gap-3">
        <Link href="/" className="btn-secondary">
          Go home
        </Link>
      </div>
    </div>
  );
}
