"use client";

import { useMemo, useState } from "react";
import { useTranslations } from "next-intl";
import { FieldSelect } from "@/components/ui/field-select";
import { STUDIO_TOPIC_LINE_MAX } from "@/lib/studio-productions/constants";
import type { StudioShortsCatalog } from "@/lib/studio-productions/shorts-catalog";

const CHANNEL_PLATFORM_OPTIONS = [
  { value: "youtube_shorts", labelKey: "channelPlatformYoutubeShorts" as const },
  { value: "instagram_reels", labelKey: "channelPlatformInstagramReels" as const },
  { value: "tiktok", labelKey: "channelPlatformTiktok" as const },
  { value: "other", labelKey: "channelPlatformOther" as const },
];

type Props = {
  catalog: StudioShortsCatalog;
  idPrefix: "new" | "edit";
  /** new episode: topic line for `{topic}` in template shell */
  showTopicLine?: boolean;
  initialNicheId?: string | null;
  initialTemplateId?: string | null;
  initialChannelId?: string | null;
};

export function StudioEpisodeShortsFields({
  catalog,
  idPrefix,
  showTopicLine = false,
  initialNicheId = null,
  initialTemplateId = null,
  initialChannelId = null,
}: Props) {
  const t = useTranslations("Dashboard.productions");
  const [nicheId, setNicheId] = useState(() => initialNicheId ?? "");
  const [templateId, setTemplateId] = useState(() => initialTemplateId ?? "");
  const [channelId, setChannelId] = useState(() => initialChannelId ?? "");

  const nicheOptions = useMemo(() => {
    const opts = catalog.niches.map((n) => ({
      value: n.id,
      label: n.display_name,
    }));
    return [{ value: "", label: t("shortsNichePlaceholder") }, ...opts];
  }, [catalog.niches, t]);

  const templateOptionsFiltered = useMemo(() => {
    const base = nicheId
      ? catalog.templateOptions.filter((x) => x.niche_id === nicheId)
      : catalog.templateOptions;
    const opts = base.map((x) => ({
      value: x.id,
      label: `${x.niche_display_name} · ${x.display_name}`,
    }));
    return [{ value: "", label: t("shortsTemplatePlaceholder") }, ...opts];
  }, [catalog.templateOptions, nicheId, t]);

  const channelOptions = useMemo(() => {
    const opts = catalog.channels.map((c) => ({
      value: c.id,
      label: `${c.label} (${c.platform})`,
    }));
    return [{ value: "", label: t("shortsChannelPlaceholder") }, ...opts];
  }, [catalog.channels, t]);

  const onTemplateChange = (nextTemplateId: string) => {
    setTemplateId(nextTemplateId);
    if (!nextTemplateId) return;
    const row = catalog.templateOptions.find((x) => x.id === nextTemplateId);
    if (row) setNicheId(row.niche_id);
  };

  return (
    <div className="rounded-2xl border border-border-subtle/90 bg-gradient-to-br from-layer-01 via-[#f5f7ff]/40 to-layer-01 p-6 shadow-sm dark:via-[#0c1520]/50">
      <h3 className="text-sm font-semibold text-text-primary mb-1">
        {t("shortsPlanTitle")}
      </h3>
      <p className="text-xs text-text-tertiary mb-4 leading-relaxed">
        {t("shortsPlanSubtitle")}
      </p>
      <div className="space-y-4">
        <div>
          <label
            htmlFor={`${idPrefix}_studio_niche_id`}
            className="block text-xs font-medium text-text-secondary mb-1.5"
          >
            {t("shortsNicheLabel")}
          </label>
          <FieldSelect
            id={`${idPrefix}_studio_niche_id`}
            name="studio_niche_id"
            value={nicheId}
            onChange={(e) => {
              setNicheId(e.target.value);
              setTemplateId("");
            }}
            options={nicheOptions}
          />
        </div>
        <div>
          <label
            htmlFor={`${idPrefix}_studio_format_template_id`}
            className="block text-xs font-medium text-text-secondary mb-1.5"
          >
            {t("shortsTemplateLabel")}
          </label>
          <FieldSelect
            id={`${idPrefix}_studio_format_template_id`}
            name="studio_format_template_id"
            value={templateId}
            onChange={(e) => onTemplateChange(e.target.value)}
            options={templateOptionsFiltered}
          />
          <p className="mt-1 text-xs text-text-tertiary">{t("shortsTemplateHint")}</p>
        </div>
        {showTopicLine ? (
          <div>
            <label
              htmlFor={`${idPrefix}_topic_line`}
              className="block text-xs font-medium text-text-secondary mb-1.5"
            >
              {t("shortsTopicLabel")}
            </label>
            <input
              id={`${idPrefix}_topic_line`}
              name="topic_line"
              maxLength={STUDIO_TOPIC_LINE_MAX}
              placeholder={t("shortsTopicPlaceholder")}
              className="h-10 w-full rounded-lg border border-border-subtle bg-field px-3 text-sm text-text-primary placeholder:text-text-tertiary focus:border-focus focus:outline-none focus:ring-2 focus:ring-focus/25"
            />
            <p className="mt-1 text-xs text-text-tertiary">{t("shortsTopicHint")}</p>
          </div>
        ) : null}
        <div>
          <label
            htmlFor={`${idPrefix}_studio_distribution_channel_id`}
            className="block text-xs font-medium text-text-secondary mb-1.5"
          >
            {t("shortsChannelLabel")}
          </label>
          <FieldSelect
            id={`${idPrefix}_studio_distribution_channel_id`}
            name="studio_distribution_channel_id"
            value={channelId}
            onChange={(e) => setChannelId(e.target.value)}
            options={channelOptions}
          />
          <p className="mt-1 text-xs text-text-tertiary">{t("shortsChannelHint")}</p>
        </div>
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
