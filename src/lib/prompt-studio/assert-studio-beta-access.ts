import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { isStudioBetaAllowlistRequired } from "@/lib/env/studio-beta";
import {
  isEmailOnPromptStudioBetaAllowlist,
  normalizeStudioBetaEmail,
} from "@/lib/prompt-studio/studio-beta-allowlist";

/**
 * When studio beta allowlist is required, ensures the signed-in user's email is listed.
 */
export async function assertPromptStudioBetaAccess(): Promise<
  | { ok: true }
  | { ok: false; reason: "not_signed_in" | "no_email" | "not_allowlisted" }
> {
  if (!isStudioBetaAllowlistRequired()) {
    return { ok: true };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, reason: "not_signed_in" };

  const raw = user.email?.trim();
  if (!raw) return { ok: false, reason: "no_email" };

  const admin = createAdminClient();
  const normalized = normalizeStudioBetaEmail(raw);
  const allowed = await isEmailOnPromptStudioBetaAllowlist(admin, normalized);
  if (!allowed) return { ok: false, reason: "not_allowlisted" };

  return { ok: true };
}
