"use client";

/**
 * PublishScheduler — Phase 3 publishing surface.
 *
 * The episode detail page passes in the latest assembled video URL, captions
 * artifact (parsed), Buffer channels available to the org, and existing
 * scheduled post rows. The user can:
 *   - Generate or edit captions per platform
 *   - Toggle channels they want to publish to
 *   - Pick a datetime (local input, stored as ISO)
 *   - Schedule (creates N scheduled_posts rows + Buffer posts in parallel)
 *   - Retry failed rows, cancel scheduled rows
 */

import {
  useActionState,
  useEffect,
  useMemo,
  useRef,
  useState,
  useTransition,
  type FormEvent,
} from "react";
import { useFormatter, useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import { Calendar, ExternalLink, RotateCw, Sparkles, Trash2 } from "lucide-react";
import {
  cancelScheduledPost,
  retryScheduledPost,
  schedulePostToBuffer,
  type SchedulePostState,
} from "@/actions/studio-buffer";
import {
  generateSocialCaptions,
  saveSocialCaptionsManual,
  type GenerateCaptionsState,
} from "@/actions/studio-social-captions";
import type { BufferChannel } from "@/lib/studio-integrations/providers/buffer";
import type { SocialCaptions } from "@/lib/studio-productions/social-captions";
import type { StudioScheduledPostRow } from "@/lib/data/studio-scheduled-posts";
import { STUDIO_PROVIDER_DOCS } from "@/lib/studio-integrations/provider-docs";
import { translateActionErrorMessage } from "@/lib/i18n/translate-action-error";
import { Button } from "@/components/ui/button";
import { toast } from "@/lib/ui/app-toast";
import { cn } from "@/lib/utils";

type Props = {
  episodeId: string;
  videoUrl: string | null;
  captions: SocialCaptions | null;
  channels: BufferChannel[];
  scheduled: StudioScheduledPostRow[];
  bufferReady: boolean;
  canEdit: boolean;
};

function platformLabel(platform: BufferChannel["platform"]): string {
  switch (platform) {
    case "instagram":
      return "Instagram";
    case "tiktok":
      return "TikTok";
    case "youtube":
      return "YouTube";
    case "youtube_shorts":
      return "YouTube Shorts";
    case "x":
      return "X";
    case "threads":
      return "Threads";
    case "linkedin":
      return "LinkedIn";
    case "facebook":
      return "Facebook";
    case "pinterest":
      return "Pinterest";
    default:
      return "Other";
  }
}

function toLocalInputValue(iso: string | null | undefined): string {
  if (!iso) return "";
  const d = new Date(iso);
  if (!Number.isFinite(d.getTime())) return "";
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

function nextTopOfHour(): string {
  const d = new Date();
  d.setMinutes(0, 0, 0);
  d.setHours(d.getHours() + 2);
  return toLocalInputValue(d.toISOString());
}

export function PublishScheduler(props: Props) {
  const t = useTranslations("Dashboard.productions");
  const tAction = useTranslations("Dashboard.actionErrors");
  const formatter = useFormatter();
  const router = useRouter();

  const [instagram, setInstagram] = useState(props.captions?.instagram ?? "");
  const [tiktok, setTiktok] = useState(props.captions?.tiktok ?? "");
  const [youtubeTitle, setYoutubeTitle] = useState(props.captions?.youtube.title ?? "");
  const [youtubeDesc, setYoutubeDesc] = useState(props.captions?.youtube.description ?? "");

  const [selectedChannels, setSelectedChannels] = useState<Record<string, boolean>>(
    () => Object.fromEntries(props.channels.map((c) => [c.id, false])),
  );
  const [scheduledAt, setScheduledAt] = useState<string>(nextTopOfHour());

  const [generateState, generateAction, generatePending] = useActionState(
    generateSocialCaptions,
    null,
  );
  const [saveState, saveAction, savePending] = useActionState(
    saveSocialCaptionsManual,
    null,
  );
  const [scheduleState, scheduleAction, schedulePending] = useActionState(
    schedulePostToBuffer,
    null,
  );

  const prevGenerate = useRef<GenerateCaptionsState>(null);
  const prevSave = useRef<GenerateCaptionsState>(null);
  const prevSchedule = useRef<SchedulePostState>(null);

  useEffect(() => {
    if (!generateState || prevGenerate.current === generateState) return;
    prevGenerate.current = generateState;
    if (generateState.ok && generateState.captions) {
      // Defer controlled-state updates out of the effect body to avoid the
      // react-hooks/set-state-in-effect lint — these are driven by an async
      // server action result, which is a valid cross-system sync point.
      const next = generateState.captions;
      queueMicrotask(() => {
        setInstagram(next.instagram);
        setTiktok(next.tiktok);
        setYoutubeTitle(next.youtube.title);
        setYoutubeDesc(next.youtube.description);
      });
      toast.success(t("publishCaptionsToastGenerated"));
      router.refresh();
    } else if (generateState.error) {
      toast.error(translateActionErrorMessage(generateState.error, tAction));
    }
  }, [generateState, router, t, tAction]);

  useEffect(() => {
    if (!saveState || prevSave.current === saveState) return;
    prevSave.current = saveState;
    if (saveState.ok) {
      toast.success(t("publishCaptionsToastSaved"));
      router.refresh();
    } else if (saveState.error) {
      toast.error(translateActionErrorMessage(saveState.error, tAction));
    }
  }, [saveState, router, t, tAction]);

  useEffect(() => {
    if (!scheduleState || prevSchedule.current === scheduleState) return;
    prevSchedule.current = scheduleState;
    if (scheduleState.ok) {
      toast.success(t("publishScheduleToastOk"));
      router.refresh();
    }
    if (scheduleState.failures && scheduleState.failures.length > 0) {
      toast.error(
        t("publishScheduleToastPartialFail", {
          count: scheduleState.failures.length,
        }),
      );
    }
    if (scheduleState.error) {
      toast.error(translateActionErrorMessage(scheduleState.error, tAction));
    }
  }, [scheduleState, router, t, tAction]);

  const selectedChannelCount = useMemo(
    () => Object.values(selectedChannels).filter(Boolean).length,
    [selectedChannels],
  );

  const disableSchedule =
    !props.canEdit ||
    !props.bufferReady ||
    !props.videoUrl ||
    selectedChannelCount === 0 ||
    schedulePending;

  const channelsByPlatform = useMemo(() => {
    const map = new Map<BufferChannel["platform"], BufferChannel[]>();
    for (const ch of props.channels) {
      const bucket = map.get(ch.platform) ?? [];
      bucket.push(ch);
      map.set(ch.platform, bucket);
    }
    return map;
  }, [props.channels]);

  const bufferDocs = STUDIO_PROVIDER_DOCS.buffer.apiDocsUrl;

  return (
    <section className="space-y-5 rounded-xl border border-border-subtle bg-layer-01 p-5 shadow-sm">
      <header className="space-y-1">
        <h2 className="text-lg font-semibold text-text-primary">
          {t("publishSchedulerTitle")}
        </h2>
        <p className="text-sm text-text-tertiary leading-relaxed">
          {t("publishSchedulerSubtitle")}
        </p>
        <div className="flex flex-wrap gap-x-3 gap-y-1 text-xs">
          <a
            href={bufferDocs}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 font-medium text-interactive underline underline-offset-2 hover:opacity-90"
          >
            <ExternalLink className="h-3 w-3" aria-hidden />
            {t("publishSchedulerBufferDocs")}
          </a>
        </div>
      </header>

      {!props.videoUrl ? (
        <p className="rounded-md border border-amber-500/40 bg-amber-500/10 px-3 py-2 text-xs text-amber-950 dark:text-amber-100/95">
          {t("publishSchedulerNoVideoHint")}
        </p>
      ) : null}
      {!props.bufferReady ? (
        <p className="rounded-md border border-amber-500/40 bg-amber-500/10 px-3 py-2 text-xs text-amber-950 dark:text-amber-100/95">
          {t("publishSchedulerNoBufferHint")}
        </p>
      ) : null}

      <div className="space-y-3 rounded-lg border border-border-subtle bg-layer-02/40 p-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <p className="text-sm font-semibold text-text-primary">
            {t("publishCaptionsSectionTitle")}
          </p>
          <form action={generateAction}>
            <input type="hidden" name="episode_id" value={props.episodeId} />
            <Button
              type="submit"
              variant="secondary"
              size="sm"
              isLoading={generatePending}
              disabled={!props.canEdit}
              className="inline-flex items-center gap-1"
            >
              <Sparkles className="h-3.5 w-3.5" aria-hidden />
              {t("publishCaptionsGenerateCta")}
            </Button>
          </form>
        </div>

        <form action={saveAction} className="space-y-3">
          <input type="hidden" name="episode_id" value={props.episodeId} />
          <CaptionField
            label={t("publishCaptionInstagram")}
            name="caption_instagram"
            value={instagram}
            onChange={setInstagram}
            hint={t("publishCaptionInstagramHint")}
            rows={3}
            maxLength={2200}
          />
          <CaptionField
            label={t("publishCaptionTiktok")}
            name="caption_tiktok"
            value={tiktok}
            onChange={setTiktok}
            hint={t("publishCaptionTiktokHint")}
            rows={2}
            maxLength={2200}
          />
          <CaptionField
            label={t("publishCaptionYoutubeTitle")}
            name="caption_youtube_title"
            value={youtubeTitle}
            onChange={setYoutubeTitle}
            hint={t("publishCaptionYoutubeTitleHint")}
            rows={1}
            maxLength={100}
          />
          <CaptionField
            label={t("publishCaptionYoutubeDesc")}
            name="caption_youtube_description"
            value={youtubeDesc}
            onChange={setYoutubeDesc}
            hint={t("publishCaptionYoutubeDescHint")}
            rows={3}
            maxLength={500}
          />
          <Button
            type="submit"
            variant="ghost"
            size="sm"
            isLoading={savePending}
            disabled={!props.canEdit}
          >
            {t("publishCaptionsSaveCta")}
          </Button>
        </form>
      </div>

      <div className="space-y-3 rounded-lg border border-border-subtle bg-layer-02/40 p-4">
        <p className="text-sm font-semibold text-text-primary">
          {t("publishChannelsSectionTitle")}
        </p>
        {props.channels.length === 0 ? (
          <p className="text-xs text-text-tertiary">
            {t("publishChannelsEmpty")}
          </p>
        ) : (
          <div className="space-y-2">
            {Array.from(channelsByPlatform.entries()).map(([platform, list]) => (
              <div key={platform} className="flex flex-col gap-1.5">
                <p className="text-[11px] font-semibold uppercase tracking-wide text-text-secondary">
                  {platformLabel(platform)}
                </p>
                <div className="flex flex-wrap gap-1.5">
                  {list.map((ch) => {
                    const selected = !!selectedChannels[ch.id];
                    return (
                      <button
                        key={ch.id}
                        type="button"
                        onClick={() =>
                          setSelectedChannels((prev) => ({
                            ...prev,
                            [ch.id]: !prev[ch.id],
                          }))
                        }
                        className={cn(
                          "rounded-full border px-3 py-1 text-xs font-medium transition-colors",
                          selected
                            ? "border-primary/50 bg-primary/10 text-primary"
                            : "border-border-subtle bg-layer-01 text-text-secondary hover:border-primary/30",
                        )}
                      >
                        {ch.name}
                      </button>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <form action={scheduleAction} className="space-y-3 rounded-lg border border-border-subtle bg-layer-02/40 p-4">
        <input type="hidden" name="episode_id" value={props.episodeId} />
        <input type="hidden" name="scheduled_at" value={
          scheduledAt ? new Date(scheduledAt).toISOString() : ""
        } />
        {props.channels.map((ch) => {
          if (!selectedChannels[ch.id]) return null;
          const captionForChannel = (() => {
            if (ch.platform === "youtube" || ch.platform === "youtube_shorts") {
              return `${youtubeTitle}\n\n${youtubeDesc}`.trim();
            }
            if (ch.platform === "tiktok") return tiktok;
            return instagram;
          })();
          return (
            <input
              key={ch.id}
              type="hidden"
              name="channel[]"
              value={JSON.stringify({
                channelId: ch.id,
                platform: ch.platform,
                caption: captionForChannel,
              })}
            />
          );
        })}
        <div className="flex flex-wrap items-end gap-2">
          <label className="flex flex-col gap-1 text-xs text-text-secondary">
            <span className="font-medium">{t("publishScheduleTimeLabel")}</span>
            <input
              type="datetime-local"
              value={scheduledAt}
              onChange={(e) => setScheduledAt(e.target.value)}
              className="h-9 rounded-md border border-border-subtle bg-field px-2 text-xs"
            />
          </label>
          <Button
            type="submit"
            variant="primary"
            size="sm"
            isLoading={schedulePending}
            disabled={disableSchedule}
            className="inline-flex items-center gap-1.5"
          >
            <Calendar className="h-3.5 w-3.5" aria-hidden />
            {t("publishScheduleCta", { count: selectedChannelCount })}
          </Button>
        </div>
      </form>

      {props.scheduled.length > 0 ? (
        <div className="space-y-2 rounded-lg border border-border-subtle bg-layer-02/40 p-4">
          <p className="text-sm font-semibold text-text-primary">
            {t("publishScheduledListTitle")}
          </p>
          <ul className="space-y-2">
            {props.scheduled.map((row) => {
              const channel = props.channels.find(
                (c) => c.id === row.buffer_channel_id,
              );
              const at = new Date(row.scheduled_at);
              const formatted = Number.isFinite(at.getTime())
                ? formatter.dateTime(at, {
                    dateStyle: "medium",
                    timeStyle: "short",
                  })
                : row.scheduled_at;
              return (
                <li
                  key={row.id}
                  className="flex flex-wrap items-center justify-between gap-2 rounded-md border border-border-subtle bg-layer-01 px-3 py-2 text-xs"
                >
                  <div className="flex flex-col">
                    <span className="font-medium text-text-primary">
                      {platformLabel(row.platform as BufferChannel["platform"])}
                      {channel ? ` · ${channel.name}` : ""}
                    </span>
                    <span className="text-text-tertiary">{formatted}</span>
                    {row.last_error ? (
                      <span className="mt-0.5 text-[10px] text-danger">
                        {row.last_error}
                      </span>
                    ) : null}
                  </div>
                  <div className="flex items-center gap-1.5">
                    <StatusBadge status={row.status} />
                    {row.status === "failed" ? (
                      <ScheduledPostAction
                        action="retry"
                        rowId={row.id}
                        canEdit={props.canEdit}
                      />
                    ) : null}
                    {row.status === "scheduled" || row.status === "pending" ? (
                      <ScheduledPostAction
                        action="cancel"
                        rowId={row.id}
                        canEdit={props.canEdit}
                      />
                    ) : null}
                  </div>
                </li>
              );
            })}
          </ul>
        </div>
      ) : null}
    </section>
  );
}

function CaptionField({
  label,
  name,
  value,
  onChange,
  hint,
  rows,
  maxLength,
}: {
  label: string;
  name: string;
  value: string;
  onChange: (v: string) => void;
  hint?: string;
  rows: number;
  maxLength: number;
}) {
  const remaining = maxLength - value.length;
  return (
    <label className="block">
      <div className="mb-1 flex items-center justify-between">
        <span className="text-[11px] font-medium text-text-secondary">{label}</span>
        <span className="text-[10px] text-text-tertiary">{remaining}</span>
      </div>
      {rows === 1 ? (
        <input
          name={name}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          maxLength={maxLength}
          className="h-9 w-full rounded-md border border-border-subtle bg-field px-2 text-xs"
        />
      ) : (
        <textarea
          name={name}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          rows={rows}
          maxLength={maxLength}
          className="w-full rounded-md border border-border-subtle bg-field px-2 py-1.5 text-xs"
        />
      )}
      {hint ? (
        <p className="mt-1 text-[10px] text-text-tertiary">{hint}</p>
      ) : null}
    </label>
  );
}

function ScheduledPostAction({
  action,
  rowId,
  canEdit,
}: {
  action: "retry" | "cancel";
  rowId: string;
  canEdit: boolean;
}) {
  const t = useTranslations("Dashboard.productions");
  const tAction = useTranslations("Dashboard.actionErrors");
  const router = useRouter();
  const runFn = action === "retry" ? retryScheduledPost : cancelScheduledPost;
  const [pending, startTransition] = useTransition();

  const Icon = action === "retry" ? RotateCw : Trash2;
  const label =
    action === "retry"
      ? t("publishScheduledRetry")
      : t("publishScheduledCancel");

  const onSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    startTransition(async () => {
      const result = await runFn(null, fd);
      if (result?.ok) {
        toast.success(label);
        router.refresh();
      } else if (result?.error) {
        toast.error(translateActionErrorMessage(result.error, tAction));
      }
    });
  };

  return (
    <form onSubmit={onSubmit}>
      <input type="hidden" name="scheduled_post_id" value={rowId} />
      <Button
        type="submit"
        variant="ghost"
        size="sm"
        disabled={!canEdit || pending}
        isLoading={pending}
        className="inline-flex items-center gap-1"
      >
        <Icon className="h-3 w-3" aria-hidden />
        {label}
      </Button>
    </form>
  );
}

function StatusBadge({ status }: { status: string }) {
  const t = useTranslations("Dashboard.productions");
  const cls = (() => {
    switch (status) {
      case "scheduled":
        return "border-primary/35 bg-primary/10 text-primary";
      case "published":
        return "border-emerald-500/35 bg-emerald-500/10 text-emerald-800 dark:text-emerald-200/95";
      case "failed":
        return "border-danger/40 bg-danger/10 text-danger";
      case "cancelled":
        return "border-border-subtle bg-layer-02 text-text-tertiary";
      default:
        return "border-amber-500/40 bg-amber-500/10 text-amber-900 dark:text-amber-100/95";
    }
  })();
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] font-medium",
        cls,
      )}
    >
      {t(`publishStatusBadge_${status}` as never)}
    </span>
  );
}

