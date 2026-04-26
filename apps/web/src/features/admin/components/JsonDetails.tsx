"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";

export function JsonDetails({
  data,
  maxPreviewLength = 120,
}: {
  data: Record<string, unknown>;
  maxPreviewLength?: number;
}) {
  const tDetail = useTranslations("dashboardDetail");
  const [open, setOpen] = useState(false);
  const str = JSON.stringify(data, null, 2);
  const preview = str.length <= maxPreviewLength ? str : str.slice(0, maxPreviewLength) + "…";

  return (
    <div className="text-aistroyka-caption">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="text-aistroyka-accent hover:underline"
      >
        {open ? tDetail("hide") : tDetail("show")} {tDetail("details")}
      </button>
      {open ? (
        <pre className="mt-1 max-h-48 overflow-auto rounded bg-aistroyka-surface-raised p-2 font-mono text-xs text-aistroyka-text-secondary whitespace-pre-wrap break-all">
          {str}
        </pre>
      ) : (
        <span className="ml-1 font-mono text-aistroyka-text-tertiary">{preview}</span>
      )}
    </div>
  );
}
