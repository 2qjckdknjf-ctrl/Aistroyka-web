"use client";

import { useEffect, useId, useRef, type ReactNode } from "react";
import { useTranslations } from "next-intl";
import { getFocusableElements, getNextFocusIndex } from "./modal-focus";

export function Modal({
  open,
  onClose,
  title,
  children,
}: {
  open: boolean;
  onClose: () => void;
  title?: string;
  children: ReactNode;
}) {
  const tCommon = useTranslations("common");
  const titleId = useId();
  const panelRef = useRef<HTMLDivElement>(null);
  const previouslyFocusedRef = useRef<HTMLElement | null>(null);
  const onCloseRef = useRef(onClose);
  onCloseRef.current = onClose;

  useEffect(() => {
    if (!open) return;

    previouslyFocusedRef.current =
      document.activeElement instanceof HTMLElement ? document.activeElement : null;

    const focusInitial = () => {
      const panel = panelRef.current;
      if (!panel) return;
      const focusables = getFocusableElements(panel);
      (focusables[0] ?? panel).focus();
    };
    // Defer so children (buttons/links) are mounted before focusing.
    const raf = window.requestAnimationFrame(focusInitial);

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault();
        event.stopPropagation();
        onCloseRef.current();
        return;
      }

      if (event.key !== "Tab" || !panelRef.current) return;

      const focusables = getFocusableElements(panelRef.current);
      if (focusables.length === 0) {
        event.preventDefault();
        panelRef.current.focus();
        return;
      }

      const active = document.activeElement;
      const currentIndex = focusables.findIndex((el) => el === active);
      const nextIndex = getNextFocusIndex(
        currentIndex === -1 ? (event.shiftKey ? 0 : focusables.length - 1) : currentIndex,
        focusables.length,
        event.shiftKey,
      );
      if (nextIndex < 0) return;

      // Only intercept when leaving the ends (or focus is outside the panel).
      const atEnd = !event.shiftKey && currentIndex === focusables.length - 1;
      const atStart = event.shiftKey && currentIndex <= 0;
      const outside = currentIndex === -1;
      if (atEnd || atStart || outside) {
        event.preventDefault();
        focusables[nextIndex]?.focus();
      }
    };

    document.addEventListener("keydown", onKeyDown);
    return () => {
      window.cancelAnimationFrame(raf);
      document.removeEventListener("keydown", onKeyDown);
      const previous = previouslyFocusedRef.current;
      if (previous && typeof previous.focus === "function") {
        previous.focus();
      }
      previouslyFocusedRef.current = null;
    };
  }, [open]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby={title ? titleId : undefined}
    >
      <div
        className="absolute inset-0"
        style={{ backgroundColor: "rgba(0,0,0,var(--aistroyka-overlay-dim))" }}
        aria-hidden
        onClick={onClose}
      />
      <div
        ref={panelRef}
        tabIndex={-1}
        className="relative w-full max-w-md rounded-[var(--aistroyka-radius-xxl)] border border-aistroyka-border-subtle bg-aistroyka-surface p-[var(--aistroyka-space-6)] shadow-[var(--aistroyka-shadow-e4)] outline-none"
      >
        {title ? (
          <h2
            id={titleId}
            className="mb-[var(--aistroyka-space-4)] text-[var(--aistroyka-font-title3)] font-semibold text-aistroyka-text-primary"
          >
            {title}
          </h2>
        ) : null}
        {children}
        <button
          type="button"
          onClick={onClose}
          className="absolute right-4 top-4 rounded p-1 text-aistroyka-text-secondary hover:bg-aistroyka-surface-raised focus:outline-none focus:ring-2 focus:ring-aistroyka-accent focus:ring-offset-2"
          aria-label={tCommon("close")}
        >
          <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 20 20">
            <path
              fillRule="evenodd"
              d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
              clipRule="evenodd"
            />
          </svg>
        </button>
      </div>
    </div>
  );
}
