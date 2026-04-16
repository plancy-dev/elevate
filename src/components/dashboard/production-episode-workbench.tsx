"use client";

import { LayoutList, Layers, Package, type LucideIcon } from "lucide-react";
import { useTranslations } from "next-intl";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import {
  Fragment,
  Suspense,
  useCallback,
  useEffect,
  useId,
  useRef,
  useTransition,
  type KeyboardEvent,
  type ReactNode,
} from "react";
import { hasPendingHandoffForEpisode } from "@/lib/studio-productions/studio-to-production-handoff";
import {
  WORKBENCH_TAB_IDS,
  type WorkbenchTabId,
  parseWorkbenchTabParam,
} from "@/lib/studio-productions/workbench-tab";
import { cn } from "@/lib/utils";

type TabId = WorkbenchTabId;

const TAB_ICONS: Record<TabId, LucideIcon> = {
  overview: LayoutList,
  episode: Layers,
  artifacts: Package,
};

/** Primary workbench navigation — divider after glance (summary vs work). */
const TAB_DIVIDER_AFTER: TabId[] = ["overview"];

function ProductionEpisodeWorkbenchInner({
  episodeId,
  overviewSlot,
  episodeSlot,
  artifactsSlot,
}: {
  episodeId: string;
  overviewSlot: ReactNode;
  episodeSlot: ReactNode;
  artifactsSlot: ReactNode;
}) {
  const t = useTranslations("Dashboard.productions");
  const baseId = useId();
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  /** Single source of truth: avoids double setState + URL sync jank on rapid tab clicks. */
  const tab: TabId =
    parseWorkbenchTabParam(searchParams.get("tab")) ?? "overview";
  const tabButtonRefs = useRef<Partial<Record<TabId, HTMLButtonElement | null>>>(
    {},
  );
  const [, startTabUrlTransition] = useTransition();

  const setTabAndUrl = useCallback(
    (next: TabId) => {
      const params = new URLSearchParams(searchParams.toString());
      if (parseWorkbenchTabParam(params.get("tab")) === next) return;
      params.set("tab", next);
      const href = `${pathname}?${params.toString()}`;
      startTabUrlTransition(() => {
        router.replace(href, { scroll: false });
      });
    },
    [pathname, router, searchParams],
  );

  /** Prompt Studio handoff: jump to Artifacts when pending (URL-only; no duplicate local state). */
  useEffect(() => {
    if (!hasPendingHandoffForEpisode(episodeId)) return;
    const params = new URLSearchParams(searchParams.toString());
    if (parseWorkbenchTabParam(params.get("tab")) === "artifacts") return;
    setTabAndUrl("artifacts");
  }, [episodeId, searchParams, setTabAndUrl]);

  const onTabListKeyDown = useCallback(
    (e: KeyboardEvent<HTMLDivElement>) => {
      if (
        e.key !== "ArrowLeft" &&
        e.key !== "ArrowRight" &&
        e.key !== "Home" &&
        e.key !== "End"
      ) {
        return;
      }
      const i = WORKBENCH_TAB_IDS.indexOf(tab);
      if (i < 0) return;
      e.preventDefault();
      let nextIdx = i;
      if (e.key === "ArrowLeft") {
        nextIdx = (i - 1 + WORKBENCH_TAB_IDS.length) % WORKBENCH_TAB_IDS.length;
      } else if (e.key === "ArrowRight") {
        nextIdx = (i + 1) % WORKBENCH_TAB_IDS.length;
      } else if (e.key === "Home") {
        nextIdx = 0;
      } else if (e.key === "End") {
        nextIdx = WORKBENCH_TAB_IDS.length - 1;
      }
      const nextId = WORKBENCH_TAB_IDS[nextIdx];
      setTabAndUrl(nextId);
      requestAnimationFrame(() => {
        tabButtonRefs.current[nextId]?.focus();
      });
    },
    [setTabAndUrl, tab],
  );

  const tabLabels: Record<TabId, string> = {
    overview: t("workbenchTabOverview"),
    episode: t("workbenchTabEpisode"),
    artifacts: t("workbenchTabArtifacts"),
  };

  return (
    <div className="space-y-3">
      <div
        role="tablist"
        aria-label={t("workbenchAriaLabel")}
        className="flex flex-wrap items-stretch gap-1 rounded-xl border border-border-subtle bg-layer-02/40 p-1.5 dark:border-border-subtle dark:bg-layer-02/60"
        onKeyDown={onTabListKeyDown}
      >
        {WORKBENCH_TAB_IDS.map((id) => {
          const selected = tab === id;
          const tabId = `${baseId}-tab-${id}`;
          const Icon = TAB_ICONS[id];
          const panelId = `${baseId}-panel-${id}`;
          return (
            <Fragment key={id}>
              <button
                ref={(el) => {
                  tabButtonRefs.current[id] = el;
                }}
                id={tabId}
                type="button"
                role="tab"
                aria-selected={selected}
                aria-controls={panelId}
                tabIndex={selected ? 0 : -1}
                className={cn(
                  "min-h-[42px] inline-flex flex-1 cursor-pointer items-center justify-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition-colors sm:flex-none sm:min-w-[7.5rem] sm:px-4",
                  selected
                    ? "bg-layer-01 text-text-primary shadow-sm ring-1 ring-border-subtle dark:bg-layer-01 dark:ring-border-subtle"
                    : "text-text-secondary hover:bg-layer-01/85 hover:text-text-primary dark:hover:bg-white/5",
                )}
                onClick={() => {
                  setTabAndUrl(id);
                }}
              >
                <Icon
                  className="h-3.5 w-3.5 shrink-0 opacity-80 sm:h-4 sm:w-4"
                  aria-hidden
                />
                <span className="truncate">{tabLabels[id]}</span>
              </button>
              {TAB_DIVIDER_AFTER.includes(id) ? (
                <div
                  className="hidden h-8 w-px shrink-0 self-center bg-border-subtle/90 sm:block"
                  aria-hidden
                />
              ) : null}
            </Fragment>
          );
        })}
      </div>
      <p className="text-xs text-text-tertiary leading-relaxed max-w-prose px-0.5">
        {t("workbenchTabsLead")}
      </p>

      <div
        id={`${baseId}-panel-overview`}
        role="tabpanel"
        aria-labelledby={`${baseId}-tab-overview`}
        hidden={tab !== "overview"}
        className={tab !== "overview" ? "hidden" : undefined}
      >
        {overviewSlot}
      </div>
      <div
        id={`${baseId}-panel-episode`}
        role="tabpanel"
        aria-labelledby={`${baseId}-tab-episode`}
        hidden={tab !== "episode"}
        className={tab !== "episode" ? "hidden" : undefined}
      >
        {episodeSlot}
      </div>
      <div
        id={`${baseId}-panel-artifacts`}
        role="tabpanel"
        aria-labelledby={`${baseId}-tab-artifacts`}
        hidden={tab !== "artifacts"}
        className={tab !== "artifacts" ? "hidden" : undefined}
      >
        {artifactsSlot}
      </div>
    </div>
  );
}

function WorkbenchTabsFallback() {
  return (
    <div
      className="h-[52px] rounded-xl border border-border-subtle bg-layer-02/40 dark:border-border-subtle animate-pulse"
      aria-hidden
    />
  );
}

export function ProductionEpisodeWorkbench(
  props: Parameters<typeof ProductionEpisodeWorkbenchInner>[0],
) {
  return (
    <Suspense fallback={<WorkbenchTabsFallback />}>
      <ProductionEpisodeWorkbenchInner {...props} />
    </Suspense>
  );
}
