"use client";

import { useTranslations } from "next-intl";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import {
  Suspense,
  startTransition,
  useCallback,
  useEffect,
  useId,
  useRef,
  useState,
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

function ProductionEpisodeWorkbenchInner({
  episodeId,
  initialTabFromUrl,
  overviewSlot,
  episodeSlot,
  artifactsSlot,
}: {
  episodeId: string;
  /** From server `searchParams.tab` so deep links match SSR + first client paint. */
  initialTabFromUrl: TabId | null;
  overviewSlot: ReactNode;
  episodeSlot: ReactNode;
  artifactsSlot: ReactNode;
}) {
  const t = useTranslations("Dashboard.productions");
  const baseId = useId();
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [tab, setTab] = useState<TabId>(
    () => initialTabFromUrl ?? "overview",
  );
  const tabButtonRefs = useRef<Partial<Record<TabId, HTMLButtonElement | null>>>(
    {},
  );

  /**
   * Sync `?tab=` without calling `router.replace` before the client router is ready
   * (avoids "Router action dispatched before initialization" during fast tab / query churn).
   */
  const setTabAndUrl = useCallback(
    (next: TabId) => {
      setTab(next);
      const params = new URLSearchParams(searchParams.toString());
      if (parseWorkbenchTabParam(params.get("tab")) === next) return;
      params.set("tab", next);
      const href = `${pathname}?${params.toString()}`;
      window.setTimeout(() => {
        startTransition(() => {
          router.replace(href, { scroll: false });
        });
      }, 0);
    },
    [pathname, router, searchParams],
  );

  /** Keep tab in sync when the query string changes (back/forward, client nav). Missing `tab` → overview. */
  useEffect(() => {
    const fromUrl = parseWorkbenchTabParam(searchParams.get("tab"));
    const id = requestAnimationFrame(() => {
      setTab(fromUrl ?? "overview");
    });
    return () => cancelAnimationFrame(id);
  }, [searchParams]);

  /** After URL→tab sync; Prompt Studio handoff overrides shared links when pending. */
  useEffect(() => {
    if (!hasPendingHandoffForEpisode(episodeId)) return;
    const t = window.setTimeout(() => {
      setTabAndUrl("artifacts");
    }, 0);
    return () => clearTimeout(t);
  }, [episodeId, setTabAndUrl]);

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

  const tabs: { id: TabId; label: string }[] = [
    { id: "overview", label: t("workbenchTabOverview") },
    { id: "episode", label: t("workbenchTabEpisode") },
    { id: "artifacts", label: t("workbenchTabArtifacts") },
  ];

  return (
    <div className="space-y-4">
      <div
        role="tablist"
        aria-label={t("workbenchAriaLabel")}
        className="flex flex-wrap gap-1 rounded-xl border border-border-subtle bg-layer-02/40 p-1 dark:border-white/10 dark:bg-white/[0.03]"
        onKeyDown={onTabListKeyDown}
      >
        {tabs.map(({ id, label }) => {
          const selected = tab === id;
          const tabId = `${baseId}-tab-${id}`;
          return (
            <button
              key={id}
              ref={(el) => {
                tabButtonRefs.current[id] = el;
              }}
              id={tabId}
              type="button"
              role="tab"
              aria-selected={selected}
              tabIndex={selected ? 0 : -1}
              className={cn(
                "min-h-[40px] flex-1 rounded-lg px-3 py-2 text-sm font-medium transition-colors sm:flex-none sm:px-4",
                selected
                  ? "bg-layer-01 text-text-primary shadow-sm ring-1 ring-border-subtle dark:bg-[#0f141c] dark:ring-white/10"
                  : "text-text-secondary hover:bg-layer-01/80 hover:text-text-primary dark:hover:bg-white/5",
              )}
              onClick={() => {
                setTabAndUrl(id);
              }}
            >
              {label}
            </button>
          );
        })}
      </div>

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
      className="h-[52px] rounded-xl border border-border-subtle bg-layer-02/40 dark:border-white/10 animate-pulse"
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
