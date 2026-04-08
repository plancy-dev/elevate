"use client";

import { useMemo, useState } from "react";
import { useTranslations } from "next-intl";
import { FieldSelect } from "@/components/ui/field-select";
import {
  DISTRIBUTION_CUSTOM,
  DISTRIBUTION_PRESET_KEYS,
  parseStoredDistribution,
  publishUrlHintMessageKey,
  publishUrlLabelKey,
  publishUrlPlaceholderKey,
} from "@/lib/studio-productions/distribution";

type Props = {
  /** Stored `distribution_label` from DB (preset key or free text). */
  distributionStored: string;
  publishUrl: string;
  idPrefix: "new" | "edit";
};

export function StudioEpisodeDistributionFields({
  distributionStored,
  publishUrl,
  idPrefix,
}: Props) {
  const t = useTranslations("Dashboard.productions");
  const parsed = useMemo(
    () => parseStoredDistribution(distributionStored),
    [distributionStored],
  );
  const [preset, setPreset] = useState(parsed.preset);
  const [customLine, setCustomLine] = useState(parsed.custom);

  const presetOptions = useMemo(() => {
    const opts = DISTRIBUTION_PRESET_KEYS.map((key) => ({
      value: key,
      label: t(`channelPreset.${key}`),
    }));
    return [
      { value: "", label: t("distributionPlaceholder") },
      ...opts,
      {
        value: DISTRIBUTION_CUSTOM,
        label: t("distributionCustom"),
      },
    ];
  }, [t]);

  const showCustom = preset === DISTRIBUTION_CUSTOM;
  const hintKey = publishUrlHintMessageKey(
    preset === "" || preset === DISTRIBUTION_CUSTOM ? "" : preset,
  );
  const labelKey = publishUrlLabelKey(
    preset === "" || preset === DISTRIBUTION_CUSTOM ? "" : preset,
  );
  const placeholderKey = publishUrlPlaceholderKey(
    preset === "" || preset === DISTRIBUTION_CUSTOM ? "" : preset,
  );

  return (
    <div className="space-y-4">
      <div>
        <label
          htmlFor={`${idPrefix}_distribution_preset`}
          className="block text-xs font-medium text-text-secondary mb-1.5"
        >
          {t("distributionLabel")}
        </label>
        <FieldSelect
          id={`${idPrefix}_distribution_preset`}
          name="distribution_preset"
          value={preset}
          onChange={(e) => setPreset(e.target.value)}
          options={presetOptions}
          aria-describedby={`${idPrefix}_distribution_hint`}
        />
        <p
          id={`${idPrefix}_distribution_hint`}
          className="mt-1.5 text-xs text-text-tertiary leading-relaxed"
        >
          {t("distributionSelectHint")}
        </p>
      </div>

      {showCustom ? (
        <div className="transition-opacity duration-200">
          <label
            htmlFor={`${idPrefix}_distribution_custom`}
            className="block text-xs font-medium text-text-secondary mb-1.5"
          >
            {t("distributionCustomLabel")}
          </label>
          <input
            id={`${idPrefix}_distribution_custom`}
            name="distribution_custom"
            value={customLine}
            onChange={(e) => setCustomLine(e.target.value)}
            maxLength={500}
            autoComplete="off"
            placeholder={t("distributionCustomPlaceholder")}
            className="h-10 w-full rounded-lg border border-border-subtle bg-field px-3 text-sm text-text-primary placeholder:text-text-tertiary focus:border-focus focus:outline-none focus:ring-2 focus:ring-focus/25"
          />
        </div>
      ) : (
        <input type="hidden" name="distribution_custom" value="" />
      )}

      <div className="rounded-xl border border-border-subtle/80 bg-gradient-to-br from-layer-02/90 via-layer-01 to-layer-02/60 p-4 shadow-sm dark:border-white/10 dark:from-[#141c28]/95 dark:via-[#0f141c] dark:to-[#0a0e14] dark:shadow-[inset_0_1px_0_rgba(255,255,255,0.04)]">
        <label
          htmlFor={`${idPrefix}_publish_url`}
          className="block text-xs font-medium text-text-primary mb-1.5"
        >
          {t(labelKey)}
        </label>
        <input
          id={`${idPrefix}_publish_url`}
          name="publish_url"
          type="url"
          inputMode="url"
          defaultValue={publishUrl}
          placeholder={t(placeholderKey)}
          autoComplete="off"
          className="h-10 w-full rounded-lg border border-border-subtle bg-field px-3 text-sm text-text-primary placeholder:text-text-tertiary focus:border-focus focus:outline-none focus:ring-2 focus:ring-focus/25"
        />
        <p className="mt-2 text-xs text-text-tertiary leading-relaxed">
          {t(hintKey)}
        </p>
      </div>
    </div>
  );
}
