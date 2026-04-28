"use client";

import { LayoutList, Layers, type LucideIcon } from "lucide-react";
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
  LEGACY_WORKBENCH_TAB_QUERY,
  WORKBENCH_TAB_IDS,
  type WorkbenchTabId,
  parseWorkbenchTabParam,
  resolveWorkbenchTabFromSearchParam,
} from "@/lib/studio-productions/workbench-tab";
import { cn } from "@/lib/utils";

type TabId = WorkbenchTabId;

const TAB_ICONS: Record<TabId, LucideIcon> = {
  overview: LayoutList,
  episode: Layers,
};

/** Primary workbench navigation — divider after glance (summary vs work). */
const TAB_DIVIDER_AFTER: TabId[] = ["overview"];

function ProductionEpisodeWorkbenchInner({
  episodeId,
  overviewSlot,
  episodeSlot,
}: {
  episodeId: string;
  overviewSlot: ReactNode;
  episodeSlot: ReactNode;
}) {
  const t = useTranslations("Dashboard.productions");
  const baseId = useId();
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  /** Primitives for hooks — `ReadonlyURLSearchParams` identity can change every render. */
  const searchQueryString = searchParams.toString();
  const workbenchTabParam = searchParams.get("tab");
  /** Single source of truth: avoids double setState + URL sync jank on rapid tab clicks. */
  const tab: TabId = resolveWorkbenchTabFromSearchParam(workbenchTabParam);
  const tabButtonRefs = useRef<Partial<Record<TabId, HTMLButtonElement | null>>>(
    {},
  );
  const [, startTabUrlTransition] = useTransition();

  const setTabAndUrl = useCallback(
    (next: TabId) => {
      const params = new URLSearchParams(searchQueryString);
      if (parseWorkbenchTabParam(params.get("tab")) === next) return;
      params.set("tab", next);
      const href = `${pathname}?${params.toString()}`;
      startTabUrlTransition(() => {
        router.replace(href, { scroll: false });
      });
    },
    [pathname, router, searchQueryString],
  );

  /** Normalize legacy `?tab=artifacts` bookmarks to Episode (artifact list moved there). */
  useEffect(() => {
    if (workbenchTabParam !== LEGACY_WORKBENCH_TAB_QUERY) return;
    const params = new URLSearchParams(searchQueryString);
    params.set("tab", "episode");
    const href = `${pathname}?${params.toString()}`;
    startTabUrlTransition(() => {
      router.replace(href, { scroll: false });
    });
  }, [workbenchTabParam, searchQueryString, pathname, router, startTabUrlTransition]);

  /** Prompt Studio handoff: open Episode tab (artifact list + anchor scroll lives there). */
  useEffect(() => {
    if (!hasPendingHandoffForEpisode(episodeId)) return;
    if (parseWorkbenchTabParam(workbenchTabParam) === "episode") return;
    setTabAndUrl("episode");
  }, [episodeId, workbenchTabParam, setTabAndUrl]);

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
  };

  return (
    <div className="space-y-3">
      <div
        role="tablist"
        aria-label={t("workbenchAriaLabel")}
        className="flex flex-wrap items-stretch gap-1 border border-ink-100 bg-paper-50 p-1.5"
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
                  "inline-flex min-h-[42px] flex-1 cursor-pointer items-center justify-center gap-2 px-3 py-2 text-sm font-medium transition-colors duration-80 ease-(--ease-editorial) sm:min-w-30 sm:flex-none sm:px-4",
                  selected
                    ? "border border-ink-100 bg-paper-100 text-ink-900"
                    : "border border-transparent text-ink-600 hover:border-ink-100 hover:bg-paper-100 hover:text-ink-900",
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
                  className="hidden h-8 w-px shrink-0 self-center bg-ink-100 sm:block"
                  aria-hidden
                />
              ) : null}
            </Fragment>
          );
        })}
      </div>
      <p className="max-w-prose px-0.5 text-xs leading-relaxed text-ink-500">
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
    </div>
  );
}

function WorkbenchTabsFallback() {
  return (
    <div
      className="h-[52px] animate-pulse border border-ink-100 bg-paper-100"
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
