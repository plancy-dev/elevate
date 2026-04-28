"use client";

import { useEffect, useState } from "react";
import { consumeHandoffForNewEpisodePage } from "@/lib/studio-productions/studio-to-production-handoff";
import {
  StudioProductionsNewForm,
  type StudioEpisodeProjectOption,
} from "@/components/dashboard/studio-productions-forms";

export function ProductionsNewHandoffForm({
  projects = [],
}: {
  projects?: StudioEpisodeProjectOption[];
}) {
  const [initialNotes, setInitialNotes] = useState<string | undefined>(undefined);

  useEffect(() => {
    const notes = consumeHandoffForNewEpisodePage() ?? "";
    requestAnimationFrame(() => {
      setInitialNotes(notes);
    });
  }, []);

  if (initialNotes === undefined) {
    return (
      <div
        className="h-[28rem] w-full animate-pulse rounded-[var(--radius-1)] border border-ink-100 bg-paper-50/70 dark:bg-paper-50/40"
        aria-hidden
      />
    );
  }

  return (
    <StudioProductionsNewForm
      key={
        initialNotes.length > 0
          ? `prefill-${initialNotes.length}-${initialNotes.charCodeAt(0) ?? 0}`
          : "no-prefill"
      }
      initialNotes={initialNotes}
      projects={projects}
    />
  );
}
