"use client";

import { Film } from "lucide-react";
import { useState, useTransition } from "react";
import { useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import { exportEditorToAssembly } from "@/actions/studio-editor-export";
import {
  useEditorDsl,
  useEditorSaveStatus,
} from "@/components/dashboard/editor/store";
import { translateActionErrorMessage } from "@/lib/i18n/translate-action-error";
import { Button } from "@/components/ui/button";
import { toast } from "@/lib/ui/app-toast";

/**
 * Export button — triggers the server assembly job with the current DSL.
 * Placed in the editor footer. Disabled while saving or when no scene
 * has a source URL.
 */
export function EditorExportButton({ episodeId }: { episodeId: string }) {
  const t = useTranslations("Dashboard.productions.editor");
  const tAction = useTranslations("Dashboard.actionErrors");
  const router = useRouter();
  const dsl = useEditorDsl();
  const status = useEditorSaveStatus();
  const [pending, startTransition] = useTransition();
  const [open, setOpen] = useState(false);

  const renderableScenes = dsl.scenes.filter((s) => s.sourceUrl.length > 0).length;
  const canExport =
    !pending &&
    renderableScenes > 0 &&
    status.state !== "saving" &&
    status.state !== "dirty";

  const handleExport = () => {
    const fd = new FormData();
    fd.set("episode_id", episodeId);
    fd.set("dsl", JSON.stringify(dsl));
    startTransition(async () => {
      const result = await exportEditorToAssembly(null, fd);
      if (result?.ok) {
        toast.success(t("exportQueued"));
        setOpen(false);
        router.refresh();
      } else if (result?.error) {
        toast.error(translateActionErrorMessage(result.error, tAction));
      }
    });
  };

  return (
    <div className="flex items-center gap-2">
      {!canExport && status.state === "dirty" ? (
        <span className="text-[11px] text-text-tertiary">
          {t("exportDirtyHint")}
        </span>
      ) : null}
      <Button
        type="button"
        variant="primary"
        size="sm"
        onClick={() => setOpen(true)}
        disabled={!canExport}
        className="inline-flex items-center gap-1.5"
      >
        <Film className="h-3.5 w-3.5" aria-hidden />
        {t("exportCta")}
      </Button>
      {open ? (
        <ExportDialog
          onCancel={() => setOpen(false)}
          onConfirm={handleExport}
          pending={pending}
          sceneCount={renderableScenes}
          overlayCount={dsl.overlays.length}
          durationSec={dsl.totalDurationSec}
        />
      ) : null}
    </div>
  );
}

function ExportDialog(props: {
  onCancel: () => void;
  onConfirm: () => void;
  pending: boolean;
  sceneCount: number;
  overlayCount: number;
  durationSec: number;
}) {
  const t = useTranslations("Dashboard.productions.editor");
  return (
    <div className="fixed inset-0 z-100 flex items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-sm rounded-xl border border-border-subtle bg-layer-01 p-5 shadow-xl">
        <h3 className="text-base font-semibold text-text-primary">
          {t("exportDialogTitle")}
        </h3>
        <p className="mt-1 text-xs text-text-tertiary">
          {t("exportDialogSubtitle")}
        </p>
        <dl className="mt-4 grid grid-cols-3 gap-2 text-center text-[11px]">
          <StatCard label={t("exportStatScenes")} value={String(props.sceneCount)} />
          <StatCard label={t("exportStatOverlays")} value={String(props.overlayCount)} />
          <StatCard
            label={t("exportStatDuration")}
            value={props.durationSec.toFixed(1) + "s"}
          />
        </dl>
        <div className="mt-5 flex justify-end gap-2">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={props.onCancel}
            disabled={props.pending}
          >
            {t("exportCancel")}
          </Button>
          <Button
            type="button"
            variant="primary"
            size="sm"
            onClick={props.onConfirm}
            isLoading={props.pending}
          >
            {t("exportConfirm")}
          </Button>
        </div>
      </div>
    </div>
  );
}

function StatCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-border-subtle bg-layer-02/50 p-2">
      <p className="text-[9px] uppercase tracking-wide text-text-tertiary">
        {label}
      </p>
      <p className="mt-0.5 text-sm font-semibold text-text-primary">{value}</p>
    </div>
  );
}
