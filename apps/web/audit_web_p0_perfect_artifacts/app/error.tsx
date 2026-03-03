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

  const message =
    IS_DEV && requestIdFromUrl
      ? `Something went wrong. Request ID: ${requestIdFromUrl}`
      : "We couldn’t complete your request. Please try again.";

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
