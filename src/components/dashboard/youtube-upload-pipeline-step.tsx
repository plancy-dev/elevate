"use client";

import { Eye, RotateCw, UploadCloud } from "lucide-react";
import { useEffect, useState } from "react";
import Link from "next/link";
import { useTranslations } from "next-intl";
import { PipelineStepAdvancedToggle } from "@/components/dashboard/pipeline-step-advanced-toggle";
import { Button } from "@/components/ui/button";
import { Modal } from "@/components/ui/modal";
import { cn } from "@/lib/utils";
import type { EpisodeFormat } from "@/lib/studio-productions/episode-format";

type PipelineStepActionState = {
  ok?: boolean;
  error?: string;
  errorDetail?: string;
} | null;

type YoutubeUploadPipelineStepProps = {
  episodeId: string;
  episodeTitle: string;
  youtubeTitleDefault: string;
  youtubeDescriptionDefault: string;
  thumbnailUrl: string | null;
  hasAssembledVideo: boolean;
  hasYoutubePublish: boolean;
  /** Published video URL after upload (read-only preview). */
  publishUrl?: string | null;
  /** OAuth-connected channel title (actual upload target). */
  youtubeChannelTitle: string | null;
  episodeFormat: EpisodeFormat;
  /** Optional: episode-linked distribution channel (planning); may differ from OAuth target. */
  distributionChannelLabel: string | null;
  step: number;
  ytState: PipelineStepActionState;
  formAction: (payload: FormData) => void;
  pending: boolean;
};

export function YoutubeUploadPipelineStep({
  episodeId,
  episodeTitle,
  youtubeTitleDefault,
  youtubeDescriptionDefault,
  thumbnailUrl,
  hasAssembledVideo,
  hasYoutubePublish,
  publishUrl = null,
  youtubeChannelTitle,
  episodeFormat,
  distributionChannelLabel,
  step,
  ytState,
  formAction,
  pending,
}: YoutubeUploadPipelineStepProps) {
  const t = useTranslations("Dashboard.productions");
  const [open, setOpen] = useState(false);
  const [modalMode, setModalMode] = useState<"preview" | "upload">("upload");
  const [cardAdvOpen, setCardAdvOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [tags, setTags] = useState("");
  const [privacy, setPrivacy] = useState("private");

  const oauthConnected = Boolean(youtubeChannelTitle?.trim());

  function syncFormFromDefaults() {
    setTitle(youtubeTitleDefault.trim() || episodeTitle || "");
    setDescription(youtubeDescriptionDefault);
    setTags("");
    setPrivacy("private");
  }

  function openModal(mode: "preview" | "upload") {
    syncFormFromDefaults();
    setModalMode(mode);
    setOpen(true);
  }

  useEffect(() => {
    if (!ytState?.ok) return;
    queueMicrotask(() => {
      setOpen(false);
    });
  }, [ytState]);

  const disabled = !hasAssembledVideo;
  const formatLabel =
    episodeFormat === "shorts"
      ? t("pipelineYoutubeFormatShorts")
      : t("pipelineYoutubeFormatLongform");

  const summaryBlock = (
    <div className="border border-ink-100 bg-paper-100 px-3 py-2 font-mono text-[11px] leading-relaxed text-ink-600">
      <p>
        <span className="font-medium text-ink-900">{t("pipelineYoutubeFormatBadge")}:</span>{""}
        {formatLabel}
      </p>
      <p className="mt-1.5">
        <span className="font-medium text-ink-900">
          {t("pipelineYoutubeUploadTarget")}:
        </span>{""}
        {oauthConnected ? (
          <span className="text-ink-900">{youtubeChannelTitle}</span>
        ) : (
          <span className="text-vermilion-600">
            {t("pipelineYoutubeNotConnectedShort")}
          </span>
        )}
      </p>
      {distributionChannelLabel?.trim() ? (
        <p className="mt-1.5 text-ink-500">
          {t("pipelineYoutubeDistributionHint")}{""}
          <span className="text-ink-700">{distributionChannelLabel.trim()}</span>
        </p>
      ) : null}
      <p className="mt-2 text-[10px] text-ink-500">{t("pipelineYoutubeOAuthExplain")}</p>
    </div>
  );

  return (
    <>
      <div
        className={cn(
          "border px-3 py-3",
          hasYoutubePublish
            ? "border-vermilion-600/35 bg-paper-0"
            : disabled
              ? "border-ink-100 bg-paper-100 opacity-60"
              : "border-ink-100 bg-paper-100",
          "sm:col-span-2",
        )}
      >
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2 min-w-0">
            <span
              className={cn(
                "flex h-5 w-5 shrink-0 items-center justify-center border font-mono text-[10px]",
                hasYoutubePublish
                  ? "border-vermilion-600 text-vermilion-600"
                  : "border-ink-300 text-ink-500",
              )}
            >
              {hasYoutubePublish ? "\u2713" : step}
            </span>
            <span className="truncate text-xs font-medium text-ink-900">
              {t("draftYoutubeCta")}
            </span>
          </div>
          <div className="flex flex-wrap items-center gap-1.5 shrink-0">
            {!disabled ? (
              <PipelineStepAdvancedToggle
                open={cardAdvOpen}
                onToggle={() => setCardAdvOpen((p) => !p)}
              />
            ) : null}
            <Button
              type="button"
              variant="secondary"
              size="sm"
              disabled={disabled}
              onClick={() => openModal("preview")}
              aria-label={t("pipelineYoutubeButtonView")}
              title={t("pipelineYoutubeButtonView")}
              className="h-7 gap-1 px-2.5 sm:gap-1.5 sm:px-3"
            >
              <Eye className="h-3.5 w-3.5 shrink-0 opacity-90" aria-hidden />
              <span>{t("pipelineYoutubeButtonView")}</span>
            </Button>
            <Button
              type="button"
              variant={hasYoutubePublish ? "secondary" : "ghost"}
              size="sm"
              disabled={disabled}
              onClick={() => openModal("upload")}
              aria-label={
                hasYoutubePublish
                  ? t("pipelineYoutubeButtonReupload")
                  : t("pipelineYoutubeButtonUpload")
              }
              title={
                hasYoutubePublish
                  ? t("pipelineYoutubeButtonReupload")
                  : t("pipelineYoutubeButtonUpload")
              }
              className="h-7 gap-1 px-2.5 sm:gap-1.5 sm:px-3"
            >
              {hasYoutubePublish ? (
                <RotateCw className="h-3.5 w-3.5 shrink-0 opacity-90" aria-hidden />
              ) : (
                <UploadCloud className="h-3.5 w-3.5 shrink-0 opacity-90" aria-hidden />
              )}
              <span>
                {hasYoutubePublish
                  ? t("pipelineYoutubeButtonReupload")
                  : t("pipelineYoutubeButtonUpload")}
              </span>
            </Button>
          </div>
        </div>
        {cardAdvOpen && !disabled ? (
          <p className="mt-2 border-t border-ink-100 pt-2 pl-7 text-[10px] leading-relaxed text-ink-500">
            {t("pipelineYoutubeCardAdvancedHint")}
          </p>
        ) : null}
        {disabled && !hasYoutubePublish ? (
          <p className="mt-1.5 pl-7 text-[10px] leading-relaxed text-ink-500">
            {t("draftYoutubeDisabledHint")}
          </p>
        ) : null}
        {!disabled && !oauthConnected ? (
          <p className="mt-1.5 pl-7 text-[10px] leading-relaxed text-ink-500">
            {t("pipelineYoutubeNotConnected")}{""}
            <Link
              href="/dashboard/productions?studio=channels"
              className="font-medium text-vermilion-600 hover:underline"
            >
              {t("draftRunwayIntegrationsLink")}
            </Link>
          </p>
        ) : null}
      </div>

      <Modal
        open={open}
        onClose={() => setOpen(false)}
        title={t("pipelineYoutubePreviewTitle")}
        description={
          modalMode === "preview"
            ? t("pipelineYoutubePreviewReadOnlyHint")
            : t("pipelineYoutubePreviewSubtitle")
        }
        size="xl"
      >
        <div className="space-y-5 text-sm">
          {summaryBlock}

          {thumbnailUrl ? (
            <div>
              <p className="mb-1.5 font-mono text-[10px] uppercase tracking-[0.04em] text-ink-500">
                {t("pipelineYoutubeThumbnailLabel")}
              </p>
              {/* eslint-disable-next-line @next/next/no-img-element -- data URL or remote preview */}
              <img
                src={thumbnailUrl}
                alt=""
                className="max-h-40 w-full max-w-md border border-ink-100 bg-paper-50 object-contain"
              />
            </div>
          ) : (
            <p className="text-xs text-ink-500">{t("pipelineYoutubeNoThumbnail")}</p>
          )}

          {hasYoutubePublish && publishUrl?.trim() ? (
            <p className="text-sm">
              <a
                href={publishUrl.trim()}
                target="_blank"
                rel="noopener noreferrer"
                className="font-medium text-vermilion-600 hover:underline"
              >
                {t("pipelineYoutubePublishedLink")}
              </a>
            </p>
          ) : null}

          {modalMode === "preview" ? (
            <div className="space-y-3 border border-ink-100 bg-paper-50 px-3 py-3">
              <div>
                <p className="font-mono text-[10px] uppercase tracking-[0.04em] text-ink-500">
                  {t("pipelineYoutubeTitleLabel")}
                </p>
                <p className="mt-1 whitespace-pre-wrap text-ink-900">{title || "—"}</p>
              </div>
              <div>
                <p className="font-mono text-[10px] uppercase tracking-[0.04em] text-ink-500">
                  {t("pipelineYoutubeDescriptionLabel")}
                </p>
                <p className="mt-1 whitespace-pre-wrap leading-relaxed text-ink-700">
                  {description || "—"}
                </p>
              </div>
            </div>
          ) : null}

          {modalMode === "upload" ? (
            <form action={formAction} className="space-y-3">
              <input type="hidden" name="episode_id" value={episodeId} />

              <div>
                <label className="mb-0.5 block font-mono text-[10px] text-ink-500" htmlFor="yt-upload-title">
                  {t("pipelineYoutubeTitleLabel")}
                </label>
                <input
                  id="yt-upload-title"
                  name="title"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  maxLength={100}
                  className="w-full border-b border-ink-300 bg-transparent px-0 py-1.5 text-sm text-ink-900 outline-none focus:border-vermilion-600"
                  required
                />
              </div>

              <div>
                <label
                  className="mb-0.5 block font-mono text-[10px] text-ink-500"
                  htmlFor="yt-upload-desc"
                >
                  {t("pipelineYoutubeDescriptionLabel")}
                </label>
                <textarea
                  id="yt-upload-desc"
                  name="description"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={5}
                  className="w-full border border-ink-100 bg-paper-0 px-2 py-1.5 text-sm text-ink-900"
                />
              </div>

              <div>
                <label className="mb-0.5 block font-mono text-[10px] text-ink-500" htmlFor="yt-tags">
                  {t("pipelineYoutubeTagsLabel")}
                </label>
                <input
                  id="yt-tags"
                  name="tags"
                  value={tags}
                  onChange={(e) => setTags(e.target.value)}
                  placeholder={t("pipelineYoutubeTagsPlaceholder")}
                  className="w-full border-b border-ink-300 bg-transparent px-0 py-1.5 text-sm text-ink-900 placeholder:text-ink-400 outline-none focus:border-vermilion-600"
                />
              </div>

              <div>
                <label className="mb-0.5 block font-mono text-[10px] text-ink-500" htmlFor="yt-privacy">
                  {t("pipelineYoutubePrivacyLabel")}
                </label>
                <select
                  id="yt-privacy"
                  name="privacy"
                  value={privacy}
                  onChange={(e) => setPrivacy(e.target.value)}
                  className="w-full max-w-xs border-b border-ink-300 bg-transparent px-0 py-1.5 text-sm text-ink-900 outline-none focus:border-vermilion-600"
                >
                  <option value="private">{t("pipelineYoutubePrivacyPrivate")}</option>
                  <option value="unlisted">{t("pipelineYoutubePrivacyUnlisted")}</option>
                  <option value="public">{t("pipelineYoutubePrivacyPublic")}</option>
                </select>
              </div>

              <div className="flex flex-wrap items-center gap-2 pt-1">
                <Button
                  type="submit"
                  disabled={!oauthConnected || disabled}
                  isLoading={pending}
                >
                  {t("pipelineYoutubeSubmit")}
                </Button>
                <Button type="button" variant="secondary" onClick={() => setOpen(false)}>
                  {t("pipelineYoutubeClose")}
                </Button>
              </div>
            </form>
          ) : (
            <div className="flex flex-wrap gap-2 pt-1">
              <Button type="button" onClick={() => setModalMode("upload")}>
                {t("pipelineYoutubeSwitchToUpload")}
              </Button>
              <Button type="button" variant="secondary" onClick={() => setOpen(false)}>
                {t("pipelineYoutubeClose")}
              </Button>
            </div>
          )}
        </div>
      </Modal>
    </>
  );
}
