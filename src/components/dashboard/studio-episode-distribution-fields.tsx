"use client";

import { useEffect, useMemo, useState } from "react";
import { useTranslations } from "next-intl";
import { FieldSelect } from "@/components/ui/field-select";
import {
  DISTRIBUTION_CUSTOM,
  DISTRIBUTION_PRESET_KEYS,
  parseStoredDistribution,
} from "@/lib/studio-productions/distribution";

type Props = {
  /** Stored `distribution_label` from DB (preset key or free text). */
  distributionStored: string;
  idPrefix: "new" | "edit";
  /** Controlled preset key (including `""`,`__custom__`, or a`DISTRIBUTION_PRESET_KEYS` value). */
  preset: string;
  onPresetChange: (preset: string) => void;
};

export function StudioEpisodeDistributionFields({
  distributionStored,
  idPrefix,
  preset,
  onPresetChange,
}: Props) {
  const t = useTranslations("Dashboard.productions");
  const parsed = useMemo(
    () => parseStoredDistribution(distributionStored),
    [distributionStored],
  );
  const [customLine, setCustomLine] = useState(parsed.custom);

  useEffect(() => {
    setCustomLine(parseStoredDistribution(distributionStored).custom);
  }, [distributionStored]);

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

  return (
    <div className="space-y-4">
      <div>
        <label
          htmlFor={`${idPrefix}_distribution_preset`}
          className="block text-xs font-medium text-ink-700 mb-1.5"
        >
          {t("distributionLabel")}
        </label>
        <FieldSelect
          id={`${idPrefix}_distribution_preset`}
          name="distribution_preset"
          value={preset}
          onChange={(e) => onPresetChange(e.target.value)}
          options={presetOptions}
          aria-describedby={`${idPrefix}_distribution_hint`}
        />
        <p
          id={`${idPrefix}_distribution_hint`}
          className="mt-1.5 text-xs text-ink-500 leading-relaxed"
        >
          {t("distributionSelectHint")}
        </p>
      </div>

      {showCustom ? (
        <div className="transition-opacity duration-200">
          <label
            htmlFor={`${idPrefix}_distribution_custom`}
            className="block text-xs font-medium text-ink-700 mb-1.5"
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
            className="h-10 w-full rounded-[var(--radius-1)] border border-ink-100 bg-paper-0 px-3 text-sm text-ink-900 placeholder:text-ink-500 focus-visible:border-focus focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus/25"
          />
        </div>
      ) : (
        <input type="hidden" name="distribution_custom" value="" />
      )}
    </div>
  );
}
