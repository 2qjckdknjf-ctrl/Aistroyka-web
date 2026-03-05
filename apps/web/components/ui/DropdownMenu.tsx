"use client";

import { useState, useRef, useEffect, type ReactNode } from "react";

export interface DropdownMenuItem {
  id: string;
  label: string;
  onClick: () => void;
  disabled?: boolean;
}

export interface DropdownMenuProps {
  trigger: ReactNode;
  items: DropdownMenuItem[];
  "aria-label"?: string;
  align?: "left" | "right";
}

export function DropdownMenu({
  trigger,
  items,
  "aria-label": ariaLabel = "Menu",
  align = "right",
}: DropdownMenuProps) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const handle = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("click", handle);
    return () => document.removeEventListener("click", handle);
  }, [open]);

  return (
    <div className="relative inline-block" ref={ref}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-haspopup="true"
        aria-expanded={open}
        aria-label={ariaLabel}
        className="inline-flex min-h-aistroyka-touch items-center justify-center rounded-[var(--aistroyka-radius-lg)] text-aistroyka-text-secondary transition-colors hover:bg-aistroyka-surface-raised hover:text-aistroyka-text-primary focus:outline-none focus:ring-2 focus:ring-aistroyka-accent"
      >
        {trigger}
      </button>
      {open && (
        <ul
          role="menu"
          className={`absolute top-full z-50 mt-1 min-w-[160px] rounded-[var(--aistroyka-radius-lg)] border border-aistroyka-border-subtle bg-aistroyka-surface py-1 shadow-[var(--aistroyka-shadow-e3)] ${
            align === "right" ? "right-0" : "left-0"
          }`}
        >
          {items.map((item) => (
            <li key={item.id} role="none">
              <button
                type="button"
                role="menuitem"
                onClick={() => {
                  item.onClick();
                  setOpen(false);
                }}
                disabled={item.disabled}
                className="w-full px-4 py-2 text-left text-[var(--aistroyka-font-subheadline)] text-aistroyka-text-primary transition-colors hover:bg-aistroyka-surface-raised disabled:opacity-50 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-aistroyka-accent"
              >
                {item.label}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
