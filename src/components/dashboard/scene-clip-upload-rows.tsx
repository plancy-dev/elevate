"use client";

import { useActionState, useEffect, useRef } from "react";
import { useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import { toast } from "@/lib/ui/app-toast";
import { translateActionErrorMessage } from "@/lib/i18n/translate-action-error";
import type { SceneRow } from "@/lib/studio-productions/scene-rows-json";
import {
  uploadStudioSceneClip,
  type StudioSceneClipUploadState,
} from "@/actions/studio-scene-clip-upload";
import { Button } from "@/components/ui/button";
import { Upload } from "lucide-react";

function SceneClipUploadRow({
  episodeId,
  row,
}: {
  episodeId: string;
  row: SceneRow;
}) {
  const t = useTranslations("Dashboard.productions");
  const tAction = useTranslations("Dashboard.actionErrors");
  const router = useRouter();
  const formRef = useRef<HTMLFormElement>(null);
  const [state, formAction, pending] = useActionState<
    StudioSceneClipUploadState | null,
    FormData
  >(uploadStudioSceneClip, null);

  useEffect(() => {
    if (!state) return;
    if (state.ok) {
      toast.success(t("pipelineSceneUploadSuccess"));
      router.refresh();
      formRef.current?.reset();
      return;
    }
    if (state.error) {
      toast.error(translateActionErrorMessage(state.error, tAction));
    }
  }, [state, t, tAction, router]);

  return (
    <form
      ref={formRef}
      action={formAction}
      className="flex flex-col gap-1.5 rounded-md border border-border-subtle/50 bg-layer-01/30 px-2 py-2 sm:flex-row sm:flex-wrap sm:items-end"
    >
      <input type="hidden" name="episode_id" value={episodeId} />
      <input type="hidden" name="scene_index" value={String(row.index)} />
      <div className="min-w-0 flex-1">
        <p className="text-[10px] font-medium text-text-tertiary">
          {t("pipelineSceneUploadRowLabel", {
            n: row.index + 1,
            seconds: row.durationSeconds,
          })}
        </p>
        <input
          type="file"
          name="file"
          accept="video/mp4,video/quicktime,video/webm"
          className="mt-1 block w-full max-w-md text-[11px] text-text-secondary file:mr-2 file:rounded file:border-0 file:bg-layer-02 file:px-2 file:py-1 file:text-[11px]"
          disabled={pending}
          required
        />
      </div>
      <div className="flex flex-wrap items-center gap-2">
        <label className="flex items-center gap-1 text-[10px] text-text-tertiary">
          <span>{t("pipelineSceneUploadTrimLabel")}</span>
          <input
            type="number"
            name="trim_start_sec"
            min={0}
            step={0.1}
            defaultValue={0}
            className="h-7 w-16 rounded border border-border-subtle bg-field px-1 text-[11px] tabular-nums"
            disabled={pending}
          />
        </label>
        <label className="flex items-center gap-1 text-[10px] text-text-tertiary">
          <input
            type="checkbox"
            name="loop"
            value="1"
            defaultChecked
            className="rounded border-border-subtle"
            disabled={pending}
          />
          {t("pipelineSceneUploadLoopLabel")}
        </label>
        <Button
          type="submit"
          variant="secondary"
          size="sm"
          className="gap-1"
          disabled={pending}
          isLoading={pending}
        >
          <Upload className="h-3.5 w-3.5" aria-hidden />
          {t("pipelineSceneUploadCta")}
        </Button>
      </div>
    </form>
  );
}

export function SceneClipUploadRows({
  episodeId,
  rows,
}: {
  episodeId: string;
  rows: SceneRow[];
}) {
  const t = useTranslations("Dashboard.productions");
  if (rows.length === 0) return null;
  return (
    <div className="space-y-2">
      <p className="text-[10px] font-semibold uppercase tracking-wide text-text-tertiary">
        {t("pipelineSceneUploadSectionTitle")}
      </p>
      <p className="text-[10px] leading-relaxed text-text-tertiary">{t("pipelineSceneUploadHint")}</p>
      <div className="space-y-2">
        {rows.map((row) => (
          <SceneClipUploadRow key={row.index} episodeId={episodeId} row={row} />
        ))}
      </div>
    </div>
  );
}
