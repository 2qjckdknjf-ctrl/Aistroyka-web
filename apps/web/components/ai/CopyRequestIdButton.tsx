"use client";

import { useState } from "react";

export function CopyRequestIdButton({ requestId }: { requestId: string }) {
  const [copied, setCopied] = useState(false);

  if (!requestId) return null;

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(requestId);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      // ignore
    }
  }

  return (
    <button
      type="button"
      onClick={handleCopy}
      className="inline-flex items-center gap-1 rounded px-2 py-1 text-xs font-mono text-aistroyka-text-tertiary hover:bg-aistroyka-surface-raised hover:text-aistroyka-text-secondary focus:outline-none focus:ring-2 focus:ring-aistroyka-accent focus:ring-offset-2"
      title="Copy request ID"
      aria-label={copied ? "Copied" : "Copy request ID"}
    >
      <span className="max-w-[120px] truncate">{requestId}</span>
      <span className="text-aistroyka-accent">{copied ? "Copied" : "Copy"}</span>
    </button>
  );
}
