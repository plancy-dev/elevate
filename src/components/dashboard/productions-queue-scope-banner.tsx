import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { FolderKanban } from "lucide-react";

type Mode = "unassigned" | "project";

type Props = {
  mode: Mode;
  projectName?: string;
};

/**
 * Context strip under the hub card — clarifies queue scope vs “프로젝트” tab (entity management).
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
    <div className="flex flex-col gap-2 rounded-lg border border-border-subtle border-l-[3px] border-l-primary bg-layer-01 px-4 py-3 sm:flex-row sm:items-center sm:justify-between sm:gap-4">
      <p className="text-sm leading-relaxed text-text-primary">
        {t("hubScopeBannerProject", { name: projectName ?? "" })}
      </p>
      <Link
        href="/dashboard/productions?studio=projects"
        className="inline-flex shrink-0 items-center gap-1.5 text-sm font-medium text-interactive hover:underline"
      >
        <FolderKanban className="h-4 w-4" aria-hidden />
        {t("hubScopeBannerProjectCta")}
      </Link>
    </div>
  );
}
