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
      <div className="rounded-[var(--radius-1)] border border-ink-100 bg-paper-50/50 px-4 py-3 text-sm text-ink-700">
        <p className="leading-relaxed">{t("hubScopeBannerUnassigned")}</p>
      </div>
    );
  }

  return (
    <div className="rounded-[var(--radius-1)] border border-ink-100 bg-paper-50/40 px-4 py-3 text-sm text-ink-700">
      <p className="leading-relaxed">{t("hubScopeBannerProject", { name: projectName ?? "" })}</p>
    </div>
  );
}
