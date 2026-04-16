"use client";

import { useMemo, useState } from "react";
import { useTranslations } from "next-intl";
import { FieldSelect } from "@/components/ui/field-select";
import type { StudioDistributionChannelRow } from "@/lib/studio-productions/shorts-catalog";

const CHANNEL_PLATFORM_OPTIONS = [
  { value: "youtube_shorts", labelKey: "channelPlatformYoutubeShorts" as const },
  { value: "youtube_long", labelKey: "channelPlatformYoutubeLong" as const },
  { value: "instagram_reels", labelKey: "channelPlatformInstagramReels" as const },
  { value: "tiktok", labelKey: "channelPlatformTiktok" as const },
  { value: "x", labelKey: "channelPlatformX" as const },
  { value: "other", labelKey: "channelPlatformOther" as const },
];

/** When distribution preset allows linking a saved org channel (Shorts, longform, X, etc.). */
export function StudioEpisodeOptionalChannelFields({
  channels,
  idPrefix,
  initialChannelId = null,
}: {
  channels: StudioDistributionChannelRow[];
  idPrefix: "new" | "edit";
  initialChannelId?: string | null;
}) {
  const t = useTranslations("Dashboard.productions");
  const [channelId, setChannelId] = useState(() => initialChannelId ?? "");

  const channelOptions = useMemo(() => {
    const opts = channels.map((c) => ({
      value: c.id,
      label: `${c.label} (${c.platform})`,
    }));
    return [{ value: "", label: t("shortsChannelPlaceholder") }, ...opts];
  }, [channels, t]);

  return (
    <div className="rounded-2xl border border-border-subtle/90 bg-gradient-to-br from-layer-01 via-primary/10 to-layer-01 p-6 shadow-sm dark:via-primary/15">
      <h3 className="text-sm font-semibold text-text-primary mb-1">
        {t("optionalChannelTitle")}
      </h3>
      <p className="text-xs text-text-tertiary mb-4 leading-relaxed">
        {t("optionalChannelSubtitle")}
      </p>
      <div>
        <label
          htmlFor={`${idPrefix}_optional_studio_distribution_channel_id`}
          className="block text-xs font-medium text-text-secondary mb-1.5"
        >
          {t("shortsChannelLabel")}
        </label>
        <FieldSelect
          id={`${idPrefix}_optional_studio_distribution_channel_id`}
          name="studio_distribution_channel_id"
          value={channelId}
          onChange={(e) => setChannelId(e.target.value)}
          options={channelOptions}
        />
        <p className="mt-1 text-xs text-text-tertiary">{t("shortsChannelHint")}</p>
      </div>
    </div>
  );
}

export function StudioChannelPlatformSelect({ id }: { id: string }) {
  const t = useTranslations("Dashboard.productions");
  const options = CHANNEL_PLATFORM_OPTIONS.map((o) => ({
    value: o.value,
    label: t(o.labelKey),
  }));
  return (
    <FieldSelect
      id={id}
      name="platform"
      defaultValue="youtube_shorts"
      options={options}
    />
  );
}
