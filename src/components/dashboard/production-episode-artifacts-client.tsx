"use client";

import { useEffect, useState } from "react";
import type { StudioProductionArtifactRow } from "@/lib/data/studio-productions";
import { consumeHandoffForEpisodeDetail } from "@/lib/studio-productions/studio-to-production-handoff";
import { StudioProductionsArtifactsSection } from "@/components/dashboard/studio-productions-forms";

export function ProductionEpisodeArtifactsClient({
  episodeId,
  artifacts,
}: {
  episodeId: string;
  artifacts: StudioProductionArtifactRow[];
}) {
  const [prefill, setPrefill] = useState<
    | {
        contentText: string;
        artifact_role: string;
        tool_platform: string;
      }
    | null
    | undefined
  >(undefined);

  useEffect(() => {
    const p = consumeHandoffForEpisodeDetail(episodeId);
    requestAnimationFrame(() => {
      setPrefill(p ?? null);
      if (p) {
        document
          .getElementById("production-artifacts-anchor")
          ?.scrollIntoView({ behavior: "smooth", block: "start" });
      }
    });
  }, [episodeId]);

  if (prefill === undefined) {
    return (
      <div
        className="mt-6 h-48 animate-pulse rounded-[var(--radius-1)] bg-paper-50/80 dark:bg-white/5"
        aria-hidden
      />
    );
  }

  return (
    <StudioProductionsArtifactsSection
      episodeId={episodeId}
      artifacts={artifacts}
      artifactAddPrefill={prefill}
    />
  );
}
