import "server-only";

import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database.types";
import {
  CUSTOM_DRAFT_TEMPLATE_PREFIX,
  DEFAULT_DRAFT_TEMPLATE_KEY,
  getDraftTemplateBiasText,
  isCustomDraftTemplateFormValue,
  normalizeDraftTemplateKey,
  parseCustomDraftTemplateId,
} from "@/lib/studio-productions/draft-prompt-templates";

export type ResolvedDraftTemplate = {
  /** Stored in snapshot metadata / thread (`custom:<uuid>` or seeded key). */
  resolvedKey: string;
  bias: string;
};

/**
 * Resolves `draft_template_key` from the generate form: seeded keys or `custom:<uuid>` for org templates.
 * Missing custom rows fall back to {@link DEFAULT_DRAFT_TEMPLATE_KEY}.
 */
export async function resolveDraftTemplateForGenerate(
  supabase: SupabaseClient<Database>,
  organizationId: string,
  rawKey: string,
): Promise<ResolvedDraftTemplate> {
  const trimmed = rawKey.trim();

  if (isCustomDraftTemplateFormValue(trimmed)) {
    const id = parseCustomDraftTemplateId(trimmed);
    if (!id) {
      return seededFallback();
    }
    const { data, error } = await supabase
      .from("studio_episode_draft_templates")
      .select("bias_body")
      .eq("id", id)
      .eq("organization_id", organizationId)
      .maybeSingle();

    if (error || !data?.bias_body?.trim()) {
      return seededFallback();
    }

    return {
      resolvedKey: `${CUSTOM_DRAFT_TEMPLATE_PREFIX}${id}`,
      bias: data.bias_body.trim(),
    };
  }

  const seed = normalizeDraftTemplateKey(trimmed);
  return {
    resolvedKey: seed,
    bias: getDraftTemplateBiasText(seed),
  };
}

function seededFallback(): ResolvedDraftTemplate {
  const k = DEFAULT_DRAFT_TEMPLATE_KEY;
  return { resolvedKey: k, bias: getDraftTemplateBiasText(k) };
}
