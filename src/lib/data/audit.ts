import { createClient } from "@/lib/supabase/server";

export type AuditLogRow = {
  id: string;
  action: string;
  entity_type: string;
  entity_id: string | null;
  metadata: Record<string, unknown>;
  created_at: string;
  actor_email: string | null;
};

export async function listAuditLogsForOrg(
  organizationId: string,
  limit = 200,
): Promise<AuditLogRow[]> {
  const supabase = await createClient();
  const { data: logs, error } = await supabase
    .from("audit_logs")
    .select(
      "id, action, entity_type, entity_id, metadata, created_at, actor_id",
    )
    .eq("organization_id", organizationId)
    .order("created_at", { ascending: false })
    .limit(limit);

  if (error) throw new Error(error.message);

  const rows = logs ?? [];
  const actorIds = [
    ...new Set(
      rows
        .map((r) => r.actor_id)
        .filter((id): id is string => typeof id === "string" && id.length > 0),
    ),
  ];

  const emailById = new Map<string, string>();
  if (actorIds.length > 0) {
    const { data: profs } = await supabase
      .from("profiles")
      .select("id, email")
      .in("id", actorIds);
    for (const p of profs ?? []) {
      emailById.set(p.id, p.email);
    }
  }

  return rows.map((r) => ({
    id: r.id,
    action: r.action,
    entity_type: r.entity_type,
    entity_id: r.entity_id,
    metadata: (r.metadata as Record<string, unknown>) ?? {},
    created_at: r.created_at,
    actor_email: r.actor_id ? emailById.get(r.actor_id) ?? null : null,
  }));
}
