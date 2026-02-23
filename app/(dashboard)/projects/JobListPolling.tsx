"use client";

import { useEffect, useRef } from "react";
import { useRouter } from "next/navigation";

const POLL_INTERVAL_MS = 3000;

/**
 * When there are pending or processing jobs, poll and refresh the page so job status and analysis update.
 */
export function JobListPolling({
  hasActiveJobs,
  children,
}: {
  hasActiveJobs: boolean;
  children: React.ReactNode;
}) {
  const router = useRouter();
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (!hasActiveJobs) return;
    intervalRef.current = setInterval(() => {
      router.refresh();
    }, POLL_INTERVAL_MS);
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [hasActiveJobs, router]);

  return <>{children}</>;
}
