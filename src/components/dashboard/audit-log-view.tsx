import type { AuditLogRow } from "@/lib/data/audit";
import { formatDateTimeUtc } from "@/lib/utils/format-date";

type Props = {
  loadError: string | null;
  rows: AuditLogRow[];
};

export function AuditLogView({ loadError, rows }: Props) {
  return (
    <>
      <p className="text-xs text-text-tertiary mb-2 max-w-2xl leading-relaxed">
        Changes made through the app (events, settings, invitations, etc.) are
        recorded here for your organization.
      </p>
      <p className="text-xs text-text-tertiary mb-4 max-w-2xl leading-relaxed border-l-2 border-border-subtle pl-3">
        Still empty after saving? Confirm{" "}
        <code className="text-text-secondary">SUPABASE_SERVICE_ROLE_KEY</code>{" "}
        is set in the server environment—audit rows are written with the
        service role. If the table is missing, apply migration{" "}
        <code className="text-text-secondary">007_audit_logs</code>.
      </p>
      {loadError ? (
        <p className="text-sm text-danger max-w-2xl" role="alert">
          {loadError}
        </p>
      ) : null}
      {!loadError && rows.length === 0 ? (
        <p className="text-sm text-text-tertiary max-w-xl">
          No entries yet. Try saving organization name or profile on Settings,
          or edit an event—then refresh this page.
        </p>
      ) : null}
      {!loadError && rows.length > 0 ? (
        <div className="border border-border-subtle bg-layer-01 overflow-x-auto">
          <table className="w-full text-sm min-w-[720px]">
            <thead>
              <tr className="border-b border-border-subtle text-left text-xs text-text-tertiary uppercase tracking-wider">
                <th className="px-4 py-2 font-medium">Time (UTC)</th>
                <th className="px-4 py-2 font-medium">Actor</th>
                <th className="px-4 py-2 font-medium">Action</th>
                <th className="px-4 py-2 font-medium">Entity</th>
                <th className="px-4 py-2 font-medium">Details</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr
                  key={r.id}
                  className="border-b border-border-subtle last:border-0 hover:bg-layer-02 align-top"
                >
                  <td className="px-4 py-2 text-text-tertiary text-xs whitespace-nowrap">
                    {formatDateTimeUtc(r.created_at)}
                  </td>
                  <td className="px-4 py-2 text-xs text-text-secondary">
                    {r.actor_email ?? "—"}
                  </td>
                  <td className="px-4 py-2 font-mono text-xs">{r.action}</td>
                  <td className="px-4 py-2 text-xs text-text-secondary">
                    {r.entity_type || "—"}
                    {r.entity_id ? (
                      <span className="block text-text-tertiary truncate max-w-[120px]">
                        {r.entity_id}
                      </span>
                    ) : null}
                  </td>
                  <td className="px-4 py-2 text-xs text-text-tertiary font-mono max-w-md break-all">
                    {Object.keys(r.metadata).length > 0
                      ? JSON.stringify(r.metadata)
                      : "—"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : null}
    </>
  );
}
