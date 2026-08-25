"use client";

import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from "react";
import { PilotModal } from "./PilotModal";

export type V41PilotOpenOptions = {
  plan?: string;
};

type V41PilotContextValue = {
  open: (options?: V41PilotOpenOptions) => void;
  close: () => void;
  isOpen: boolean;
};

const V41PilotContext = createContext<V41PilotContextValue | null>(null);

export function V41PilotProvider({ children }: { children: ReactNode }) {
  const [isOpen, setIsOpen] = useState(false);
  const [plan, setPlan] = useState("");
  const open = useCallback((options?: V41PilotOpenOptions) => {
    setPlan(options?.plan?.trim() ?? "");
    setIsOpen(true);
  }, []);
  const close = useCallback(() => setIsOpen(false), []);
  const value = useMemo(() => ({ open, close, isOpen }), [open, close, isOpen]);

  return (
    <V41PilotContext.Provider value={value}>
      {children}
      {isOpen ? <PilotModal onClose={close} plan={plan} /> : null}
    </V41PilotContext.Provider>
  );
}

export function useV41Pilot(): V41PilotContextValue {
  const ctx = useContext(V41PilotContext);
  if (!ctx) {
    throw new Error("useV41Pilot must be used within V41PilotProvider");
  }
  return ctx;
}

export function useOptionalV41Pilot(): V41PilotContextValue | null {
  return useContext(V41PilotContext);
}
