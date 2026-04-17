import { after } from "next/server";
import { revalidatePath } from "next/cache";
import { createAdminClient } from "@/lib/supabase/admin";
import type { Json } from "@/types/database.types";

type LogParams = {
  organizationId: string;
  /** When unknown (e.g. external webhook), omit or pass null — `audit_logs.actor_id` is nullable. */
  actorId?: string | null;
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
      actor_id: params.actorId ?? null,
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
    // Revalidate outside the current render — logAudit may run during RSC render.
    after(() => {
      revalidatePath("/dashboard/organization/audit");
    });
  } catch (e) {
    if (process.env.NODE_ENV === "development") {
      const msg = e instanceof Error ? e.message : String(e);
      console.warn("[audit] logAudit failed:", msg);
    }
  }
}
