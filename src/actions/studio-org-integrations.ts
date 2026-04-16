"use server";

import { revalidatePath } from "next/cache";
import { getOrgEditorContext } from "@/lib/auth/require-org-editor";
import { listStudioOrgProviderConnectionsMeta } from "@/lib/data/studio-org-integrations";
import { ActionErrorCode } from "@/lib/i18n/action-error-codes";
import { createClient } from "@/lib/supabase/server";
import {
  decryptProviderSecret,
  encryptProviderSecret,
  isStudioIntegrationsEncryptionConfigured,
} from "@/lib/studio-integrations/crypto";
import {
  readStudioIntegrationsServerEnabled,
} from "@/lib/studio-integrations/feature";
import { verifyStudioProviderSecret } from "@/lib/studio-integrations/verify-studio-provider-secret";
import type { StudioIntegrationProviderId } from "@/lib/studio-integrations/types";
import { STUDIO_INTEGRATION_PROVIDER_IDS } from "@/lib/studio-integrations/types";

const SECRET_MAX_BYTES = 8192;

/** Postgres CHECK on provider, or migration not applied (e.g. anthropic). */
function isProviderCheckViolation(err: { code?: string; message?: string }): boolean {
  if (err.code === "23514") return true;
  const m = err.message ?? "";
  return (
    m.includes("studio_org_provider_connections_provider_check") ||
    (m.includes("violates check constraint") && m.includes("provider"))
  );
}

export type StudioOrgIntegrationActionState =
  | { error?: string; success?: string }
  | undefined;

function isProviderId(value: string): value is StudioIntegrationProviderId {
  return (STUDIO_INTEGRATION_PROVIDER_IDS as readonly string[]).includes(value);
}

export async function saveStudioProviderSecret(
  _prev: StudioOrgIntegrationActionState,
  formData: FormData,
): Promise<StudioOrgIntegrationActionState> {
  const providerRaw = String(formData.get("provider") ?? "").trim();
  const secret = String(formData.get("secret") ?? "");

  if (!isProviderId(providerRaw)) {
    return { error: ActionErrorCode.studioIntegrationsProviderInvalid };
  }
  if (secret.trim().length === 0) {
    return { error: ActionErrorCode.studioIntegrationsSecretRequired };
  }
  if (secret.length > SECRET_MAX_BYTES) {
    return { error: ActionErrorCode.studioIntegrationsSecretTooLong };
  }

  if (!isStudioIntegrationsEncryptionConfigured()) {
    return { error: ActionErrorCode.studioIntegrationsEncryptionNotConfigured };
  }

  const supabase = await createClient();
  const auth = await getOrgEditorContext(supabase);
  if (!auth.ok) return { error: auth.error };

  let ciphertext: string;
  try {
    ciphertext = encryptProviderSecret(secret);
  } catch {
    return { error: ActionErrorCode.studioIntegrationsEncryptionNotConfigured };
  }

  const now = new Date().toISOString();
  const { error } = await supabase.from("studio_org_provider_connections").upsert(
    {
      organization_id: auth.ctx.organizationId,
      provider: providerRaw,
      secret_ciphertext: ciphertext,
      updated_by: auth.ctx.userId,
      updated_at: now,
      created_by: auth.ctx.userId,
    },
    { onConflict: "organization_id,provider" },
  );

  if (error) {
    return {
      error: isProviderCheckViolation(error)
        ? ActionErrorCode.studioIntegrationsDbProviderNotAllowed
        : ActionErrorCode.dbError,
    };
  }

  revalidatePath("/dashboard/productions");
  revalidatePath("/dashboard/productions/integrations");
  return { success: "saved" };
}

export async function deleteStudioProviderConnection(
  _prev: StudioOrgIntegrationActionState,
  formData: FormData,
): Promise<StudioOrgIntegrationActionState> {
  const providerRaw = String(formData.get("provider") ?? "").trim();
  if (!isProviderId(providerRaw)) {
    return { error: ActionErrorCode.studioIntegrationsProviderInvalid };
  }

  const supabase = await createClient();
  const auth = await getOrgEditorContext(supabase);
  if (!auth.ok) return { error: auth.error };

  const { error } = await supabase
    .from("studio_org_provider_connections")
    .delete()
    .eq("organization_id", auth.ctx.organizationId)
    .eq("provider", providerRaw);

  if (error) return { error: ActionErrorCode.dbError };

  revalidatePath("/dashboard/productions");
  revalidatePath("/dashboard/productions/integrations");
  return { success: "deleted" };
}

export async function testStudioProviderIntegration(
  _prev: StudioOrgIntegrationActionState,
  formData: FormData,
): Promise<StudioOrgIntegrationActionState> {
  const providerRaw = String(formData.get("provider") ?? "").trim();
  if (!isProviderId(providerRaw)) {
    return { error: ActionErrorCode.studioIntegrationsProviderInvalid };
  }

  if (!readStudioIntegrationsServerEnabled()) {
    return { error: ActionErrorCode.studioIntegrationsDisabled };
  }
  if (!isStudioIntegrationsEncryptionConfigured()) {
    return { error: ActionErrorCode.studioIntegrationsEncryptionNotConfigured };
  }

  const supabase = await createClient();
  const auth = await getOrgEditorContext(supabase);
  if (!auth.ok) return { error: auth.error };

  const { data: row, error: fetchErr } = await supabase
    .from("studio_org_provider_connections")
    .select("secret_ciphertext")
    .eq("organization_id", auth.ctx.organizationId)
    .eq("provider", providerRaw)
    .maybeSingle();

  if (fetchErr || !row?.secret_ciphertext) {
    return { error: ActionErrorCode.studioIntegrationsProviderNotConfigured };
  }

  let secret: string;
  try {
    secret = decryptProviderSecret(row.secret_ciphertext);
  } catch {
    return { error: ActionErrorCode.dbError };
  }

  const ok = await verifyStudioProviderSecret(providerRaw, secret);
  if (!ok) {
    return {
      error:
        providerRaw === "openai"
          ? ActionErrorCode.studioIntegrationsOpenAiTestFailed
          : ActionErrorCode.studioIntegrationsProviderVerifyFailed,
    };
  }

  const verifiedAt = new Date().toISOString();
  const { error: upErr } = await supabase
    .from("studio_org_provider_connections")
    .update({
      last_verified_at: verifiedAt,
      updated_at: verifiedAt,
      updated_by: auth.ctx.userId,
    })
    .eq("organization_id", auth.ctx.organizationId)
    .eq("provider", providerRaw);

  if (upErr) return { error: ActionErrorCode.dbError };

  revalidatePath("/dashboard/productions");
  revalidatePath("/dashboard/productions/integrations");
  return { success: "testOk" };
}

/**
 * Decrypt and return the saved secret for org editors only (Vercel-style “reveal”).
 * Never logs the value.
 */
export async function revealStudioProviderSecret(
  providerRaw: StudioIntegrationProviderId,
): Promise<
  | { ok: true; secret: string }
  | { ok: false; error: string }
> {
  if (!isProviderId(providerRaw)) {
    return { ok: false, error: ActionErrorCode.studioIntegrationsProviderInvalid };
  }
  if (!isStudioIntegrationsEncryptionConfigured()) {
    return {
      ok: false,
      error: ActionErrorCode.studioIntegrationsEncryptionNotConfigured,
    };
  }

  const supabase = await createClient();
  const auth = await getOrgEditorContext(supabase);
  if (!auth.ok) return { ok: false, error: auth.error };

  const { data: row, error: fetchErr } = await supabase
    .from("studio_org_provider_connections")
    .select("secret_ciphertext")
    .eq("organization_id", auth.ctx.organizationId)
    .eq("provider", providerRaw)
    .maybeSingle();

  if (fetchErr || !row?.secret_ciphertext) {
    return {
      ok: false,
      error: ActionErrorCode.studioIntegrationsProviderNotConfigured,
    };
  }

  try {
    const secret = decryptProviderSecret(row.secret_ciphertext);
    return { ok: true, secret };
  } catch {
    return { ok: false, error: ActionErrorCode.dbError };
  }
}

/** Server-only: load connection metadata for integrations UI. */
export async function getStudioIntegrationsPageData(): Promise<{
  organizationId: string | null;
  canEdit: boolean;
  connections: Awaited<
    ReturnType<typeof listStudioOrgProviderConnectionsMeta>
  >;
}> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return { organizationId: null, canEdit: false, connections: [] };
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("organization_id, role")
    .eq("id", user.id)
    .maybeSingle();

  const orgId = profile?.organization_id ?? null;
  if (!orgId) {
    return { organizationId: null, canEdit: false, connections: [] };
  }

  const role = profile?.role ?? "viewer";
  const canEdit = ["admin", "organizer", "coordinator"].includes(role);

  const connections = await listStudioOrgProviderConnectionsMeta(
    supabase,
    orgId,
  );

  return { organizationId: orgId, canEdit, connections };
}
