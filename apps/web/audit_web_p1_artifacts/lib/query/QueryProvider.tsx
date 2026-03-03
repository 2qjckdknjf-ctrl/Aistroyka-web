"use client";

import { useState } from "react";
import { QueryClientProvider } from "@tanstack/react-query";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";
import { getQueryClient } from "./queryClient";

const IS_DEV_OR_STAGING =
  typeof process !== "undefined" &&
  (process.env.NODE_ENV !== "production" ||
    (process.env.NEXT_PUBLIC_ENV ?? "").toLowerCase() === "staging" ||
    (process.env.NEXT_PUBLIC_VERCEL_ENV ?? "").toLowerCase() === "staging");

export function QueryProvider({ children }: { children: React.ReactNode }) {
  const [client] = useState(getQueryClient);
  return (
    <QueryClientProvider client={client}>
      {children}
      {IS_DEV_OR_STAGING && (
        <ReactQueryDevtools initialIsOpen={false} buttonPosition="bottom-left" />
      )}
    </QueryClientProvider>
  );
}
