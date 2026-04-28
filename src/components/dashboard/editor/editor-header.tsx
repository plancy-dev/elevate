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
    <header className="flex items-center justify-between border-b border-ink-100 bg-paper-100 px-4 py-2.5">
      <div className="flex items-center gap-3">
        <Link
          href={`/dashboard/productions/${episodeId}?tab=episode`}
          className="inline-flex h-8 w-8 items-center justify-center border border-ink-300 text-ink-500 transition-colors duration-80 ease-(--ease-editorial) hover:border-ink-900 hover:bg-paper-0 hover:text-ink-900"
          aria-label={t("closeAria")}
        >
          <X className="h-4 w-4" aria-hidden />
        </Link>
        <div className="min-w-0">
          <p className="font-mono text-[11px] uppercase tracking-[0.04em] text-ink-500">
            {t("breadcrumb")}
          </p>
          <h1 className="max-w-[48ch] truncate text-sm font-semibold text-ink-900">
            {episodeTitle}
          </h1>
        </div>
      </div>
      <div className="flex items-center gap-3 text-xs text-ink-500">
        <span
          className={
            status.state === "error"
              ? "text-vermilion-600"
              : status.state === "saving"
                ? "text-vermilion-600"
                : "text-ink-500"
          }
        >
          {statusLabel(status, t)}
        </span>
        <span className="border border-ink-100 bg-paper-0 px-2 py-0.5 font-mono text-[11px]">
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
