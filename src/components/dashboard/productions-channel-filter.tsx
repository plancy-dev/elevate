"use client";

import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { FieldSelect } from "@/components/ui/field-select";

export function ProductionsChannelFilter({
  channels,
  currentChannelId,
}: {
  channels: { id: string; label: string; platform: string }[];
  currentChannelId: string | null;
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

  return (
    <div className="w-full max-w-xs">
      <label htmlFor="prod-channel-filter" className="sr-only">
        {t("listFilterChannelLabel")}
      </label>
      <FieldSelect
        id="prod-channel-filter"
        name="channel_filter"
        value={currentChannelId ?? ""}
        onChange={(e) => {
          const v = e.target.value;
          if (!v) router.push("/dashboard/productions");
          else router.push(`/dashboard/productions?channel=${encodeURIComponent(v)}`);
        }}
        options={options}
      />
    </div>
  );
}
