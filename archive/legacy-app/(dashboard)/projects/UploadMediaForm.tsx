"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";

export function UploadMediaForm({ projectId }: { projectId: string }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  async function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setError(null);
    setLoading(true);
    const form = new FormData();
    form.set("file", file);
    const res = await fetch(`/api/projects/${projectId}/upload`, {
      method: "POST",
      body: form,
    });
    const data = await res.json().catch(() => ({}));
    setLoading(false);
    if (inputRef.current) inputRef.current.value = "";
    if (!res.ok) {
      setError(data.error ?? "Upload failed");
      return;
    }
    router.refresh();
  }

  return (
    <div>
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        onChange={handleChange}
        disabled={loading}
        className="text-sm"
      />
      {loading && <span className="ml-2 text-sm text-gray-500">Uploading…</span>}
      {error && (
        <p className="mt-1 text-sm text-red-600" role="alert">
          {error}
        </p>
      )}
    </div>
  );
}
