"use client";

import { useMemo, useState } from "react";
import type { Json } from "@/types/database.types";
import { Modal } from "@/components/ui/modal";

export function AdminRunMetadataCell({
  metadata,
  previewChars = 140,
  maxWidthClass = "max-w-[240px]",
  labels,
}: {
  metadata: Json | null;
  previewChars?: number;
  maxWidthClass?: string;
  labels: {
    empty: string;
    open: string;
    modalTitle: string;
    modalDescription: string;
    close: string;
  };
}) {
  const [open, setOpen] = useState(false);

  const compact = useMemo(() => {
    if (!metadata) return null;
    return JSON.stringify(metadata);
  }, [metadata]);

  const pretty = useMemo(() => {
    if (!metadata) return null;
    return JSON.stringify(metadata, null, 2);
  }, [metadata]);

  if (!compact || !pretty) {
    return <span>{labels.empty}</span>;
  }

  const preview =
    compact.length > previewChars
      ? `${compact.slice(0, previewChars)}...`
      : compact;

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className={`inline-flex max-w-full items-center gap-1.5 border border-ink-100 bg-paper-50 px-2 py-1 text-[11px] text-ink-700 hover:bg-highlight ${maxWidthClass}`}
        title={compact}
      >
        <span className="truncate">{preview}</span>
        <span className="shrink-0 text-ink-500">{labels.open}</span>
      </button>

      <Modal
        open={open}
        onClose={() => setOpen(false)}
        title={labels.modalTitle}
        description={labels.modalDescription}
        size="2xl"
      >
        <div className="space-y-3">
          <pre className="max-h-[62vh] overflow-auto whitespace-pre-wrap wrap-break-word border border-ink-100 bg-paper-0 p-3 text-xs leading-relaxed text-ink-800">
            {pretty}
          </pre>
          <div className="flex justify-end">
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="border border-ink-100 bg-paper-50 px-3 py-1.5 text-xs text-ink-900 hover:bg-highlight"
            >
              {labels.close}
            </button>
          </div>
        </div>
      </Modal>
    </>
  );
}
