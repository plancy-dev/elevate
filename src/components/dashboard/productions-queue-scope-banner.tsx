import { getTranslations } from "next-intl/server";

type Mode = "unassigned" | "project";

type Props = {
  mode: Mode;
  projectName?: string;
};

/**
 * Context strip under the hub card — clarifies which project (or unassigned) the episode list reflects.
 */
export async function ProductionsQueueScopeBanner({ mode, projectName }: Props) {
  const t = await getTranslations("Dashboard.productions");

  if (mode === "unassigned") {
    return (
      <div className="rounded-lg border border-border-subtle bg-layer-02/50 px-4 py-3 text-sm text-text-secondary">
        <p className="leading-relaxed">{t("hubScopeBannerUnassigned")}</p>
      </div>
    );
  }

  return (
    <div className="rounded-lg border border-border-subtle border-l-[3px] border-l-primary bg-layer-01 px-4 py-3">
      <p className="text-sm leading-relaxed text-text-primary">
        {t("hubScopeBannerProject", { name: projectName ?? "" })}
      </p>
    </div>
  );
}
