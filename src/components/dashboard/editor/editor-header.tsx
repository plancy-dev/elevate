"use client";

import { X } from "lucide-react";
import { useTranslations } from "next-intl";
import Link from "next/link";
import {
  useEditorDsl,
  useEditorSaveStatus,
} from "@/components/dashboard/editor/store";

function statusLabel(
  status: ReturnType<typeof useEditorSaveStatus>,
  t: ReturnType<typeof useTranslations<"Dashboard.productions.editor">>,
): string {
  switch (status.state) {
    case "idle":
      return t("saveIdle");
    case "dirty":
      return t("saveDirty");
    case "saving":
      return t("saveSaving");
    case "saved":
      return t("saveSaved");
    case "error":
      return t("saveError", { code: status.code });
  }
}

export function EditorHeader({
  episodeId,
  episodeTitle,
}: {
  episodeId: string;
  episodeTitle: string;
}) {
  const t = useTranslations("Dashboard.productions.editor");
  const dsl = useEditorDsl();
  const status = useEditorSaveStatus();

  return (
    <header className="flex items-center justify-between border-b border-border-subtle bg-layer-01 px-4 py-2.5">
      <div className="flex items-center gap-3">
        <Link
          href={`/dashboard/productions/${episodeId}?tab=episode`}
          className="inline-flex h-8 w-8 items-center justify-center rounded-md border border-border-subtle text-text-secondary hover:bg-layer-02 hover:text-text-primary"
          aria-label={t("closeAria")}
        >
          <X className="h-4 w-4" aria-hidden />
        </Link>
        <div className="min-w-0">
          <p className="text-[11px] font-medium uppercase tracking-wide text-text-tertiary">
            {t("breadcrumb")}
          </p>
          <h1 className="max-w-[48ch] truncate text-sm font-semibold text-text-primary">
            {episodeTitle}
          </h1>
        </div>
      </div>
      <div className="flex items-center gap-3 text-xs text-text-tertiary">
        <span
          className={
            status.state === "error"
              ? "text-danger"
              : status.state === "saving"
                ? "text-primary"
                : "text-text-tertiary"
          }
        >
          {statusLabel(status, t)}
        </span>
        <span className="rounded-md border border-border-subtle bg-layer-02 px-2 py-0.5">
          {t("stats", {
            scenes: dsl.scenes.length,
            overlays: dsl.overlays.length,
            duration: dsl.totalDurationSec.toFixed(1),
          })}
        </span>
      </div>
    </header>
  );
}
