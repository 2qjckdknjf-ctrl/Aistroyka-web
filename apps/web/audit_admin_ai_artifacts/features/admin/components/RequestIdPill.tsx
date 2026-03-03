"use client";

import { useState } from "react";

export function RequestIdPill({ requestId, showCopy = true }: { requestId: string; showCopy?: boolean }) {
  const [copied, setCopied] = useState(false);
  const short = requestId.length > 12 ? requestId.slice(0, 8) + "…" : requestId;

  const copy = () => {
    void navigator.clipboard.writeText(requestId).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  return (
    <span className="inline-flex items-center gap-1 rounded bg-aistroyka-surface-raised px-2 py-0.5 font-mono text-aistroyka-caption text-aistroyka-text-secondary">
      <span title={requestId}>{short}</span>
      {showCopy ? (
        <button
          type="button"
          onClick={copy}
          className="text-aistroyka-accent hover:underline"
          title="Copy request ID"
        >
          {copied ? "Copied" : "Copy"}
        </button>
      ) : null}
    </span>
  );
}
