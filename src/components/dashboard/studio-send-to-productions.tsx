"use client";

import { usePostHog } from "posthog-js/react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { useCallback, useRef, useState } from "react";
import { Clapperboard } from "lucide-react";
import { PostHogEvent } from "@/lib/analytics/posthog-events";
import { writeStudioToProductionsHandoff } from "@/lib/studio-productions/studio-to-production-handoff";
import { Button } from "@/components/ui/button";
import { FieldSelect } from "@/components/ui/field-select";
import { cn } from "@/lib/utils";

export type StudioEpisodeOption = { id: string; title: string };

export function StudioSendToProductions({
  episodes,
}: {
  episodes: StudioEpisodeOption[];
}) {
  const t = useTranslations("Dashboard.studio.sendToProductions");
  const router = useRouter();
  const posthog = usePostHog();
  const dialogRef = useRef<HTMLDialogElement>(null);
  const [promptText, setPromptText] = useState("");
  const [target, setTarget] = useState<"new_episode" | "existing_episode">(
    "new_episode",
  );
  const [episodeId, setEpisodeId] = useState<string>(
    episodes[0]?.id ?? "",
  );

  const openDialog = useCallback(() => {
    const trimmed = promptText.trim();
    if (!trimmed) {
      window.alert(t("emptyPrompt"));
      return;
    }
    dialogRef.current?.showModal();
  }, [promptText, t]);

  const closeDialog = useCallback(() => {
    dialogRef.current?.close();
  }, []);

  const onConfirm = useCallback(() => {
    const trimmed = promptText.trim();
    if (!trimmed) {
      window.alert(t("emptyPrompt"));
      return;
    }
    if (target === "existing_episode") {
      if (!episodeId || !episodes.some((e) => e.id === episodeId)) {
        window.alert(t("pickEpisode"));
        return;
      }
    }

    writeStudioToProductionsHandoff({
      contentText: trimmed,
      target:
        target === "new_episode" ? "new_episode" : "existing_episode",
      episodeId: target === "existing_episode" ? episodeId : null,
    });

    posthog?.capture(PostHogEvent.ELEVATE_STUDIO_TO_PRODUCTIONS_HANDOFF, {
      target:
        target === "new_episode" ? "new_episode" : "existing_episode",
    });

    closeDialog();
    if (target === "new_episode") {
      router.push("/dashboard/productions/new");
    } else {
      router.push(`/dashboard/productions/${episodeId}`);
    }
  }, [
    closeDialog,
    episodeId,
    episodes,
    posthog,
    promptText,
    router,
    t,
    target,
  ]);

  const episodeSelectOptions = [
    { value: "", label: t("episodePlaceholder"), disabled: true },
    ...episodes.map((e) => ({ value: e.id, label: e.title })),
  ];

  return (
    <section className="space-y-3" aria-labelledby="studio-prompt-heading">
      <div className="flex items-center gap-2 mb-3">
        <Clapperboard className="h-5 w-5 text-primary shrink-0" aria-hidden />
        <h2
          id="studio-prompt-heading"
          className="text-sm font-semibold text-ink-900"
        >
          {t("scratchTitle")}
        </h2>
      </div>
      <p className="text-xs text-ink-500 mb-3 leading-relaxed">
        {t("scratchHint")}
      </p>
      <label htmlFor="studio_prompt_scratch" className="sr-only">
        {t("scratchLabel")}
      </label>
      <textarea
        id="studio_prompt_scratch"
        value={promptText}
        onChange={(e) => setPromptText(e.target.value)}
        rows={6}
        placeholder={t("scratchPlaceholder")}
        className="w-full min-h-[140px] rounded-[var(--radius-1)] border border-ink-100 bg-paper-0 px-3 py-3 text-sm leading-relaxed text-ink-900 placeholder:text-ink-500 focus-visible:border-focus focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus/25 dark:border-ink-100"
      />
      <div className="mt-4 flex flex-wrap gap-3">
        <Button variant="primary" type="button" onClick={openDialog}>
          {t("cta")}
        </Button>
      </div>

      <dialog
        ref={dialogRef}
        className={cn(
          "w-[min(100%,420px)] border border-ink-700 bg-paper-100 p-5 backdrop:bg-black/40",
        )}
        aria-labelledby="studio-handoff-dialog-title"
        aria-describedby="studio-handoff-dialog-desc"
        onClose={() => {}}
      >
        <h3
          id="studio-handoff-dialog-title"
          className="text-base font-semibold text-ink-900 mb-1"
        >
          {t("dialogTitle")}
        </h3>
        <p
          id="studio-handoff-dialog-desc"
          className="text-xs text-ink-500 mb-4 leading-relaxed"
        >
          {t("dialogHint")}
        </p>
        <fieldset className="space-y-3 mb-4">
          <legend className="sr-only">{t("dialogTitle")}</legend>
          <label className="flex cursor-pointer items-start gap-2 rounded-[var(--radius-1)] border border-transparent px-1 py-1 hover:bg-paper-50/80 dark:hover:bg-white/5">
            <input
              type="radio"
              name="handoff_target"
              className="mt-1"
              checked={target === "new_episode"}
              onChange={() => {
                setTarget("new_episode");
              }}
            />
            <span>
              <span className="block text-sm font-medium text-ink-900">
                {t("optionNew")}
              </span>
              <span className="block text-xs text-ink-500">
                {t("optionNewDesc")}
              </span>
            </span>
          </label>
          <label
            className={`flex cursor-pointer items-start gap-2 rounded-[var(--radius-1)] border px-1 py-1 hover:bg-paper-50/80 dark:hover:bg-white/5 ${
              episodes.length === 0
                ? "cursor-not-allowed opacity-50"
                : "border-transparent"
            }`}
          >
            <input
              type="radio"
              name="handoff_target"
              className="mt-1"
              disabled={episodes.length === 0}
              checked={target === "existing_episode"}
              onChange={() => {
                setTarget("existing_episode");
                if (episodes[0]?.id) setEpisodeId(episodes[0].id);
              }}
            />
            <span className="min-w-0 flex-1">
              <span className="block text-sm font-medium text-ink-900">
                {t("optionExisting")}
              </span>
              <span className="block text-xs text-ink-500">
                {t("optionExistingDesc")}
              </span>
              {target === "existing_episode" && episodes.length > 0 ? (
                <div className="mt-2">
                  <FieldSelect
                    id="handoff_episode"
                    name="_handoff_episode"
                    value={episodeId}
                    onChange={(e) => setEpisodeId(e.target.value)}
                    options={episodeSelectOptions}
                    controlSize="md"
                  />
                </div>
              ) : null}
              {target === "existing_episode" && episodes.length === 0 ? (
                <p className="mt-2 text-xs text-ink-500">{t("noEpisodes")}</p>
              ) : null}
            </span>
          </label>
        </fieldset>
        <div className="flex flex-wrap justify-end gap-2">
          <Button variant="secondary" type="button" onClick={closeDialog}>
            {t("cancel")}
          </Button>
          <Button variant="primary" type="button" onClick={onConfirm}>
            {t("continue")}
          </Button>
        </div>
      </dialog>
    </section>
  );
}
