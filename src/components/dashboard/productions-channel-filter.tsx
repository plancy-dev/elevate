"use client";

import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { FieldSelect } from "@/components/ui/field-select";

export function ProductionsChannelFilter({
  channels,
  currentChannelId,
  /** Preserved when changing channel (`""`= all,`"none"` = unassigned, else project id). */
  preserveProjectParam,
  controlLabel,
}: {
  channels: { id: string; label: string; platform: string }[];
  currentChannelId: string | null;
  preserveProjectParam?: string;
  /** Visible label above the select. */
  controlLabel?: string;
}) {
  const t = useTranslations("Dashboard.productions");
  const router = useRouter();

  const options = [
    { value: "", label: t("listFilterAllChannels") },
    ...channels.map((c) => ({
      value: c.id,
      label: `${c.label} (${c.platform})`,
    })),
  ];

  const buildUrl = (channelId: string | null) => {
    const p = new URLSearchParams();
    if (channelId) p.set("channel", channelId);
    if (preserveProjectParam) p.set("project", preserveProjectParam);
    const qs = p.toString();
    return qs ? `/dashboard/productions?${qs}` : "/dashboard/productions";
  };

  return (
    <div className="w-full min-w-0 max-w-full sm:max-w-xs sm:min-w-[12rem]">
      {controlLabel ? (
        <p className="mb-1.5 text-[11px] font-medium uppercase tracking-wide text-ink-500">
          {controlLabel}
        </p>
      ) : null}
      <label htmlFor="prod-channel-filter" className="sr-only">
        {t("listFilterChannelLabel")}
      </label>
      <FieldSelect
        id="prod-channel-filter"
        name="channel_filter"
        value={currentChannelId ?? ""}
        onChange={(e) => {
          const v = e.target.value.trim();
          router.push(buildUrl(v || null));
        }}
        options={options}
      />
    </div>
  );
}
