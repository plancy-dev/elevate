import { revalidatePath } from "next/cache";
import { createAdminClient } from "@/lib/supabase/admin";
import type { Json } from "@/types/database.types";

type LogParams = {
  organizationId: string;
  actorId: string;
  action: string;
  entityType?: string;
  entityId?: string | null;
  metadata?: Record<string, unknown>;
};

/**
 * Append-only audit row (service role). Never throws — failures are swallowed
 * so primary actions are not blocked if logging fails.
 */
export async function logAudit(params: LogParams): Promise<void> {
  try {
    const admin = createAdminClient();
    const { error } = await admin.from("audit_logs").insert({
      organization_id: params.organizationId,
      actor_id: params.actorId,
      action: params.action,
      entity_type: params.entityType ?? "",
      entity_id: params.entityId ?? null,
      metadata: (params.metadata ?? {}) as Json,
    });
    if (error) {
      if (process.env.NODE_ENV === "development") {
        console.warn("[audit] insert failed:", error.message);
      }
      return;
    }
    revalidatePath("/admin/audit");
  } catch (e) {
    if (process.env.NODE_ENV === "development") {
      const msg = e instanceof Error ? e.message : String(e);
      console.warn("[audit] logAudit failed:", msg);
    }
  }
}
