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
        className="rounded-sm border border-border-subtle bg-layer-01 p-4 space-y-3"
      >
        <h2 className="text-sm font-medium text-text-primary">{t("bccHeading")}</h2>
        <p className="text-xs text-text-tertiary leading-relaxed">{t("bccIntro")}</p>
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
              className="w-full px-3 py-2 text-sm border border-border-subtle bg-background text-text-primary"
            />
          </div>
          <button
            type="submit"
            disabled={pending}
            className="text-xs px-3 py-2 border border-border-subtle bg-layer-02 hover:bg-highlight text-text-primary disabled:opacity-50"
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
          <h2 className="text-sm font-medium text-text-primary">{t("listHeading")}</h2>
          <button
            type="button"
            onClick={() => refresh()}
            disabled={pending}
            className="text-xs text-interactive hover:text-primary disabled:opacity-50"
          >
            {t("refresh")}
          </button>
        </div>
        {rows.length === 0 ? (
          <p className="text-xs text-text-tertiary">{t("empty")}</p>
        ) : (
          <div className="overflow-x-auto border border-border-subtle rounded-sm">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-border-subtle bg-layer-02">
                  <th className="p-2 font-medium text-text-secondary">{t("colEmail")}</th>
                  <th className="p-2 font-medium text-text-secondary">{t("colLocale")}</th>
                  <th className="p-2 font-medium text-text-secondary">{t("colSource")}</th>
                  <th className="p-2 font-medium text-text-secondary">{t("colTime")}</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((r) => (
                  <tr key={r.id} className="border-b border-border-subtle/80">
                    <td className="p-2 text-text-primary font-mono">{r.email}</td>
                    <td className="p-2 text-text-secondary">{r.locale ?? "—"}</td>
                    <td className="p-2 text-text-secondary">{r.source}</td>
                    <td className="p-2 text-text-tertiary whitespace-nowrap">
                      {new Date(r.created_at).toISOString().replace("T", " ").slice(0, 19)} UTC
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
