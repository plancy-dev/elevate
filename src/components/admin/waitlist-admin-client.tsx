"use client";

import { useState, useTransition } from "react";
import { useTranslations } from "next-intl";
import {
  getWaitlistEmailSettings,
  listWaitlistSignups,
  updateWaitlistBccEmail,
  type WaitlistSignupRow,
} from "@/actions/waitlist-admin";

export function WaitlistAdminClient({
  initialRows,
  initialBcc,
}: {
  initialRows: WaitlistSignupRow[];
  initialBcc: string | null;
}) {
  const t = useTranslations("Dashboard.adminWaitlist");
  const [rows, setRows] = useState(initialRows);
  const [bcc, setBcc] = useState(initialBcc ?? "");
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function refresh() {
    startTransition(async () => {
      const res = await listWaitlistSignups();
      if (res.ok) setRows(res.rows);
    });
  }

  function onSaveBcc(e: React.FormEvent) {
    e.preventDefault();
    setMessage(null);
    setError(null);
    startTransition(async () => {
      const res = await updateWaitlistBccEmail(bcc);
      if (!res.ok) {
        setError(
          res.error === "invalid_email" ? t("errors.invalidEmail") : res.error,
        );
        return;
      }
      const s = await getWaitlistEmailSettings();
      if (s.ok) setBcc(s.waitlistBccEmail ?? "");
      setMessage(t("bccSaved"));
    });
  }

  return (
    <div className="space-y-8 max-w-4xl">
      <form
        onSubmit={onSaveBcc}
        className="space-y-3 rounded-[var(--radius-1)] border border-ink-100 bg-paper-0 p-4"
      >
        <h2 className="text-sm font-medium text-ink-900">{t("bccHeading")}</h2>
        <p className="text-xs text-ink-500 leading-relaxed">{t("bccIntro")}</p>
        <div className="flex flex-wrap gap-2 items-end">
          <div className="flex-1 min-w-[200px]">
            <label htmlFor="waitlist-bcc" className="sr-only">
              {t("bccLabel")}
            </label>
            <input
              id="waitlist-bcc"
              type="email"
              autoComplete="email"
              value={bcc}
              onChange={(e) => setBcc(e.target.value)}
              placeholder={t("bccPlaceholder")}
              className="w-full px-3 py-2 text-sm border border-ink-100 bg-paper-50 text-ink-900"
            />
          </div>
          <button
            type="submit"
            disabled={pending}
            className="text-xs px-3 py-2 border border-ink-100 bg-paper-50 hover:bg-highlight text-ink-900 disabled:opacity-50"
          >
            {pending ? t("saving") : t("bccSave")}
          </button>
        </div>
        {message ? (
          <p className="text-xs text-emerald-700 dark:text-emerald-400">{message}</p>
        ) : null}
        {error ? (
          <p className="text-xs text-danger">{error}</p>
        ) : null}
      </form>

      <div>
        <div className="flex items-center justify-between gap-2 mb-2">
          <h2 className="text-sm font-medium text-ink-900">{t("listHeading")}</h2>
          <button
            type="button"
            onClick={() => refresh()}
            disabled={pending}
            className="text-xs text-vermilion-600 hover:text-vermilion-700 disabled:opacity-50"
          >
            {t("refresh")}
          </button>
        </div>
        {rows.length === 0 ? (
          <p className="text-xs text-ink-500">{t("empty")}</p>
        ) : (
          <div className="overflow-x-auto rounded-[var(--radius-1)] border border-ink-100">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-ink-100 bg-paper-50">
                  <th className="p-2 font-medium text-ink-700">{t("colEmail")}</th>
                  <th className="p-2 font-medium text-ink-700">{t("colLocale")}</th>
                  <th className="p-2 font-medium text-ink-700">{t("colSource")}</th>
                  <th className="p-2 font-medium text-ink-700">{t("colTime")}</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((r) => (
                  <tr key={r.id} className="border-b border-ink-100/80">
                    <td className="p-2 text-ink-900 font-mono">{r.email}</td>
                    <td className="p-2 text-ink-700">{r.locale ?? "—"}</td>
                    <td className="p-2 text-ink-700">{r.source}</td>
                    <td className="p-2 text-ink-500 whitespace-nowrap">
                      {new Date(r.created_at).toISOString().replace("T", "").slice(0, 19)} UTC
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
