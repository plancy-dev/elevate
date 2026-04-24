import { notFound } from "next/navigation";
import { Suspense } from "react";
import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { createClient } from "@/lib/supabase/server";
import {
  getStudioEpisodeForOrg,
  listStudioArtifactsForEpisode,
} from "@/lib/data/studio-productions";
import { resolveEpisodeFormat } from "@/lib/studio-productions/episode-format";
import { scenePlanRowsFromPipelinePrefs } from "@/lib/studio-productions/episode-scene-plan-dto";
import { bootstrapEditorDsl } from "@/lib/studio-productions/bootstrap-editor-dsl";
import { readEditorDslFromPipelinePrefs } from "@/lib/studio-productions/editor-dsl-storage";
import { EditorShell } from "@/components/dashboard/editor/editor-shell";

type Props = {
  params: Promise<{ episodeId: string }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { episodeId } = await params;
  const t = await getTranslations("Dashboard.productions.editor");
  return {
    title: `${t("metaTitle")} · ${episodeId.slice(0, 8)}`,
  };
}

export default async function ProductionEditorPage({ params }: Props) {
  const { episodeId } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) notFound();

  const { data: prof } = await supabase
    .from("profiles")
    .select("organization_id")
    .eq("id", user.id)
    .maybeSingle();
  const orgId = prof?.organization_id;
  if (!orgId) notFound();

  const episode = await getStudioEpisodeForOrg(supabase, episodeId, orgId);
  if (!episode) notFound();

  const artifacts = await listStudioArtifactsForEpisode(supabase, episodeId, orgId);
  const scenePlanRows = scenePlanRowsFromPipelinePrefs(
    episode.pipeline_prefs ?? null,
  );
  const format = resolveEpisodeFormat(episode);

  const persisted = readEditorDslFromPipelinePrefs(episode.pipeline_prefs ?? null);
  const initialDsl =
    persisted && persisted.episodeId === episodeId
      ? persisted
      : bootstrapEditorDsl({
          episodeId,
          format,
          scenePlan: scenePlanRows,
          artifacts,
        });

  return (
    <Suspense fallback={null}>
      <EditorShell
        episodeId={episodeId}
        episodeTitle={episode.title}
        initialDsl={initialDsl}
      />
    </Suspense>
  );
}
