"use server";

import { revalidatePath } from "next/cache";
import { getOrgMemberContext } from "@/lib/auth/require-org-editor";
import { ActionErrorCode } from "@/lib/i18n/action-error-codes";
import { createClient } from "@/lib/supabase/server";

export type StudioChannelActionState = { error?: string } | undefined;

const PLATFORMS = new Set([
  "youtube_shorts",
  "youtube_long",
  "instagram_reels",
  "tiktok",
  "x",
  "other",
]);

function validateHttpsChannelUrl(raw: string):
  | { ok: true; value: string }
  | { ok: false; error: string } {
  const s = raw.trim();
  if (!s) return { ok: false, error: ActionErrorCode.studioInvalidUrl };
  try {
    const u = new URL(s);
    if (u.protocol !== "https:") {
      return { ok: false, error: ActionErrorCode.studioInvalidUrl };
    }
    return { ok: true, value: s };
  } catch {
    return { ok: false, error: ActionErrorCode.studioInvalidUrl };
  }
}

export async function createStudioDistributionChannel(
  _prev: StudioChannelActionState,
  formData: FormData,
): Promise<StudioChannelActionState> {
  const label = String(formData.get("label") ?? "").trim();
  if (!label) return { error: ActionErrorCode.studioChannelLabelRequired };

  const platformRaw = String(formData.get("platform") ?? "youtube_shorts").trim();
  if (!PLATFORMS.has(platformRaw)) return { error: ActionErrorCode.unexpected };

  const urlCheck = validateHttpsChannelUrl(String(formData.get("channel_url") ?? ""));
  if (!urlCheck.ok) return { error: urlCheck.error };

  const notes = String(formData.get("notes") ?? "").trim().slice(0, 4_000);

  const supabase = await createClient();
  const auth = await getOrgMemberContext(supabase);
  if (!auth.ok) return { error: auth.error };

  const { error } = await supabase.from("studio_distribution_channels").insert({
    organization_id: auth.ctx.organizationId,
    label,
    platform: platformRaw,
    channel_url: urlCheck.value,
    notes,
    updated_at: new Date().toISOString(),
  });

  if (error) return { error: ActionErrorCode.dbError };

  revalidatePath("/dashboard/productions");
  revalidatePath("/dashboard/productions/channels");
  return undefined;
}

export async function deleteStudioDistributionChannel(
  _prev: StudioChannelActionState,
  formData: FormData,
): Promise<StudioChannelActionState> {
  const id = String(formData.get("channel_id") ?? "").trim();
  if (!id) return { error: ActionErrorCode.unexpected };

  const supabase = await createClient();
  const auth = await getOrgMemberContext(supabase);
  if (!auth.ok) return { error: auth.error };

  const { data: rows, error } = await supabase
    .from("studio_distribution_channels")
    .delete()
    .eq("id", id)
    .eq("organization_id", auth.ctx.organizationId)
    .select("id");

  if (error) return { error: ActionErrorCode.dbError };
  if (!rows?.length) return { error: ActionErrorCode.unexpected };

  revalidatePath("/dashboard/productions");
  revalidatePath("/dashboard/productions/channels");
  return undefined;
}
