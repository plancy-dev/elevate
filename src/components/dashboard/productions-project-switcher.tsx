"use client";

import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { FieldSelect } from "@/components/ui/field-select";

type ProjectOption = { id: string; name: string };

/** URL query value for episodes with no project. */
export const PROJECT_QUERY_UNASSIGNED = "none";

export function ProductionsProjectSwitcher({
  projects,
  countsByProjectId,
  totalCountAll,
  unassignedCount,
  /** "" = all, PROJECT_QUERY_UNASSIGNED = no project, else project UUID */
  selectedScope,
  currentChannelId,
  controlLabel,
}: {
  projects: ProjectOption[];
  countsByProjectId: Record<string, number>;
  totalCountAll: number;
  unassignedCount: number;
  selectedScope: string;
  currentChannelId: string | null;
  /** Visible label above the select (design system alignment). */
  controlLabel?: string;
}) {
  const t = useTranslations("Dashboard.productions");
  const router = useRouter();

  const buildProductionsUrl = (scope: string) => {
    const p = new URLSearchParams();
    if (currentChannelId) p.set("channel", currentChannelId);
    if (scope === PROJECT_QUERY_UNASSIGNED) {
      p.set("project", PROJECT_QUERY_UNASSIGNED);
    } else if (scope) {
      p.set("project", scope);
    }
    const qs = p.toString();
    return qs ? `/dashboard/productions?${qs}` : "/dashboard/productions";
  };

  const options = [
    {
      value: "",
      label: t("projectSwitcherAll", { count: totalCountAll }),
    },
    {
      value: PROJECT_QUERY_UNASSIGNED,
      label: t("projectSwitcherUnassigned", { count: unassignedCount }),
    },
    ...projects.map((proj) => ({
      value: proj.id,
      label: t("projectSwitcherOption", {
        name: proj.name,
        count: countsByProjectId[proj.id] ?? 0,
      }),
    })),
  ];

  return (
    <div className="w-full min-w-0 max-w-full sm:max-w-md">
      {controlLabel ? (
        <p className="mb-1.5 text-[11px] font-medium uppercase tracking-wide text-ink-500">
          {controlLabel}
        </p>
      ) : null}
      <label htmlFor="prod-project-switcher" className="sr-only">
        {t("projectSwitcherLabel")}
      </label>
      <FieldSelect
        id="prod-project-switcher"
        value={selectedScope}
        onChange={(e) => {
          router.push(buildProductionsUrl(e.target.value));
        }}
        options={options}
        controlSize="md"
      />
    </div>
  );
}
