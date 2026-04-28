"use client";

import { useTranslations } from "next-intl";
import type { AuditLogRow } from "@/lib/data/audit";
import { formatDateTimeUtc } from "@/lib/utils/format-date";

type Props = {
  loadError: string | null;
  rows: AuditLogRow[];
};

export function AuditLogView({ loadError, rows }: Props) {
  const t = useTranslations("Dashboard.audit");

  return (
    <>
      <p className="text-xs text-ink-500 mb-2 max-w-2xl leading-relaxed">
        {t("intro")}
      </p>
      <p className="text-xs text-ink-500 mb-4 max-w-2xl leading-relaxed border-l-2 border-ink-100 pl-3">
        {t("hint")}
      </p>
      {loadError ? (
        <p className="text-sm text-danger max-w-2xl" role="alert">
          {loadError}
        </p>
      ) : null}
      {!loadError && rows.length === 0 ? (
        <p className="text-sm text-ink-500 max-w-xl">{t("empty")}</p>
      ) : null}
      {!loadError && rows.length > 0 ? (
        <div className="border border-ink-100 bg-paper-0 overflow-x-auto">
          <table className="w-full text-sm min-w-[720px]">
            <thead>
              <tr className="border-b border-ink-100 text-left text-xs text-ink-500 uppercase tracking-wider">
                <th className="px-4 py-2 font-medium">{t("colTime")}</th>
                <th className="px-4 py-2 font-medium">{t("colActor")}</th>
                <th className="px-4 py-2 font-medium">{t("colAction")}</th>
                <th className="px-4 py-2 font-medium">{t("colEntity")}</th>
                <th className="px-4 py-2 font-medium">{t("colDetails")}</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr
                  key={r.id}
                  className="border-b border-ink-100 last:border-0 hover:bg-paper-50 align-top"
                >
                  <td className="px-4 py-2 text-ink-500 text-xs whitespace-nowrap">
                    {formatDateTimeUtc(r.created_at)}
                  </td>
                  <td className="px-4 py-2 text-xs text-ink-700">
                    {r.actor_email ?? "—"}
                  </td>
                  <td className="px-4 py-2 font-mono text-xs">{r.action}</td>
                  <td className="px-4 py-2 text-xs text-ink-700">
                    {r.entity_type || "—"}
                    {r.entity_id ? (
                      <span className="block text-ink-500 truncate max-w-[120px]">
                        {r.entity_id}
                      </span>
                    ) : null}
                  </td>
                  <td className="px-4 py-2 text-xs text-ink-500 font-mono max-w-md break-all">
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
