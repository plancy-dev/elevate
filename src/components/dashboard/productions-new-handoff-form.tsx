"use client";

import { useEffect, useState } from "react";
import { consumeHandoffForNewEpisodePage } from "@/lib/studio-productions/studio-to-production-handoff";
import { StudioProductionsNewForm } from "@/components/dashboard/studio-productions-forms";

export function ProductionsNewHandoffForm() {
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
        className="h-40 max-w-2xl animate-pulse rounded-2xl bg-layer-02/80 dark:bg-white/5"
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
    />
  );
}
