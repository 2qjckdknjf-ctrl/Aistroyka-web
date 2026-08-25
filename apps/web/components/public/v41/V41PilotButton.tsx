"use client";

import type { ReactNode } from "react";
import { useV41Pilot } from "./V41PilotContext";

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
  return (
    <button type={type} className={className} onClick={() => open(plan ? { plan } : undefined)} data-testid={testId}>
      {children}
    </button>
  );
}
