"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { getOrgMemberContext } from "@/lib/auth/require-org-editor";
import { ActionErrorCode } from "@/lib/i18n/action-error-codes";
import { createClient } from "@/lib/supabase/server";
import { insertDemoStudioSeedForOrg } from "@/lib/studio-productions/insert-demo-seed";

export type StudioDemoSeedState = { error?: string } | undefined;

function isDemoSeedEnabled(): boolean {
  return process.env.ENABLE_STUDIO_DEMO_SEED === "true";
}

/**
 * Inserts demo episodes + artifacts for the signed-in user's org.
 * Guarded by `ENABLE_STUDIO_DEMO_SEED=true` (local/staging only — do not enable in production).
 * Only runs when the org has zero episodes (idempotent guard).
 */
export async function seedDemoStudioProductions(
  // useActionState passes previous state; not used for idempotent seed
  // eslint-disable-next-line @typescript-eslint/no-unused-vars -- server action signature
  _prev: StudioDemoSeedState,
): Promise<StudioDemoSeedState> {
  if (!isDemoSeedEnabled()) {
    return { error: ActionErrorCode.studioDemoSeedDisabled };
  }

  const supabase = await createClient();
  const auth = await getOrgMemberContext(supabase);
  if (!auth.ok) return { error: auth.error };

  const result = await insertDemoStudioSeedForOrg(supabase, {
    organizationId: auth.ctx.organizationId,
    createdBy: auth.ctx.userId,
    requireEmpty: true,
  });

  if (!result.ok && result.reason === "not_empty") {
    return { error: ActionErrorCode.studioDemoSeedNotEmpty };
  }
  if (!result.ok) {
    return { error: ActionErrorCode.dbError };
  }

  revalidatePath("/dashboard/productions");
  redirect("/dashboard/productions");
}
