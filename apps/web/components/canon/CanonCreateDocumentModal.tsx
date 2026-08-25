"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { Modal, Input, Select, Textarea } from "@/components/ui";

type CanonCreateDocumentModalProps = {
  open: boolean;
  onClose: () => void;
  onSubmit: (body: {
    type: string;
    title: string;
    description?: string;
  }, file: File | null) => Promise<void>;
  isSubmitting: boolean;
  error: string | null;
};

export function CanonCreateDocumentModal({
  open,
  onClose,
  onSubmit,
  isSubmitting,
  error,
}: CanonCreateDocumentModalProps) {
  const t = useTranslations("canon");
  const tCommon = useTranslations("common");
  const tDetail = useTranslations("dashboardDetail");
  const tDash = useTranslations("dashboard");
  const [type, setType] = useState("document");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [file, setFile] = useState<File | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const trimmed = title.trim();
    if (!trimmed) return;
    await onSubmit(
      {
        type,
        title: trimmed,
        description: description.trim() || undefined,
      },
      file,
    );
    setTitle("");
    setDescription("");
    setFile(null);
    setType("document");
  }

  if (!open) return null;

  return (
    <Modal open={open} onClose={onClose} title={t("uploadFiles")}>
      <form onSubmit={handleSubmit} className="space-y-4">
        <Input
          id="canon-doc-title"
          label={tDetail("title")}
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          required
          disabled={isSubmitting}
        />
        <div>
          <label htmlFor="canon-doc-type" className="mb-1.5 block text-sm font-medium text-[var(--canon-text-primary)]">
            {tDetail("type")}
          </label>
          <Select
            id="canon-doc-type"
            value={type}
            onChange={(e) => setType(e.target.value)}
            disabled={isSubmitting}
          >
            <option value="document">{tDetail("document")}</option>
            <option value="act">{tDetail("act")}</option>
            <option value="contract">{tDetail("contract")}</option>
          </Select>
        </div>
        <Textarea
          id="canon-doc-description"
          label={tDetail("descriptionOptional")}
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          disabled={isSubmitting}
          rows={2}
        />
        <div>
          <label className="mb-1.5 block text-sm font-medium text-[var(--canon-text-primary)]">
            {t("docFilePickerLabel")}
          </label>
          <input
            type="file"
            accept=".pdf,.doc,.docx,.xls,.xlsx,.png,.jpg,.jpeg"
            disabled={isSubmitting}
            onChange={(e) => setFile(e.target.files?.[0] ?? null)}
            className="block w-full text-sm text-[var(--canon-text-secondary)] file:mr-3 file:rounded-lg file:border-0 file:bg-[rgba(255,193,7,0.15)] file:px-3 file:py-2 file:text-sm file:font-medium file:text-[var(--canon-gold)]"
          />
          <p className="mt-1 text-xs text-[var(--canon-text-muted)]">{t("docFilePickerHint")}</p>
        </div>
        {error ? (
          <p className="text-sm text-[var(--canon-danger)]" role="alert">{error}</p>
        ) : null}
        <div className="flex flex-wrap justify-end gap-2 pt-2">
          <button type="button" className="canon-ghost-btn" onClick={onClose} disabled={isSubmitting}>
            {tCommon("cancel")}
          </button>
          <button type="submit" className="canon-gold-btn" disabled={isSubmitting || !title.trim()}>
            {isSubmitting ? tDash("creating") : t("uploadFiles")}
          </button>
        </div>
      </form>
    </Modal>
  );
}
