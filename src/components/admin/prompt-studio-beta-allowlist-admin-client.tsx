"use client";

import { useCallback, useState } from "react";
import { useTranslations } from "next-intl";
import {
  addPromptStudioBetaAllowlistEntry,
  listPromptStudioBetaAllowlist,
  removePromptStudioBetaAllowlistEntry,
  type PromptStudioBetaAllowlistRow,
} from "@/actions/prompt-studio-beta-allowlist-admin";

type Props = {
  initialRows: PromptStudioBetaAllowlistRow[];
};

export function PromptStudioBetaAllowlistAdminClient({ initialRows }: Props) {
  const t = useTranslations("Dashboard.adminPromptStudioAllowlist");
  const [rows, setRows] = useState(initialRows);
  const [email, setEmail] = useState("");
  const [note, setNote] = useState("");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const onAdd = useCallback(async () => {
    setMessage(null);
    setBusy(true);
    try {
      const r = await addPromptStudioBetaAllowlistEntry({
        email,
        note: note || null,
      });
      if (!r.ok) {
        if (r.error === "invalid_email") setMessage(t("errors.invalidEmail"));
        else if (r.error === "duplicate") setMessage(t("errors.duplicate"));
        else setMessage(r.error);
        return;
      }
      setEmail("");
      setNote("");
      const list = await listPromptStudioBetaAllowlist();
      if (list.ok) setRows(list.rows);
    } finally {
      setBusy(false);
    }
  }, [email, note, t]);

  const onRemove = useCallback(async (id: string) => {
    setMessage(null);
    setBusy(true);
    try {
      const r = await removePromptStudioBetaAllowlistEntry(id);
      if (!r.ok) {
        setMessage(r.error);
        return;
      }
      setRows((prev) => prev.filter((x) => x.id !== id));
    } finally {
      setBusy(false);
    }
  }, []);

  return (
    <div className="max-w-2xl space-y-8">
      <p className="text-sm text-ink-700 leading-relaxed">{t("intro")}</p>

      <div className="space-y-3 rounded-[var(--radius-1)] border border-ink-100 bg-paper-50/50 p-4">
        <div>
          <label htmlFor="ps-allow-email" className="text-xs font-medium text-ink-500">
            {t("emailLabel")}
          </label>
          <input
            id="ps-allow-email"
            type="email"
            autoComplete="off"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="mt-1 w-full rounded-[var(--radius-1)] border border-ink-100 bg-paper-50 px-3 py-2 text-sm"
            placeholder="you@company.com"
          />
        </div>
        <div>
          <label htmlFor="ps-allow-note" className="text-xs font-medium text-ink-500">
            {t("noteLabel")}
          </label>
          <input
            id="ps-allow-note"
            type="text"
            value={note}
            onChange={(e) => setNote(e.target.value)}
            className="mt-1 w-full rounded-[var(--radius-1)] border border-ink-100 bg-paper-50 px-3 py-2 text-sm"
          />
        </div>
        <button
          type="button"
          disabled={busy || !email.trim()}
          onClick={() => void onAdd()}
          className="rounded-[var(--radius-1)] bg-primary px-3 py-2 text-sm font-medium text-paper-0 hover:bg-primary-hover disabled:opacity-50"
        >
          {t("add")}
        </button>
      </div>

      {message ? (
        <p className="text-sm text-danger" role="alert">
          {message}
        </p>
      ) : null}

      <div>
        <h2 className="text-sm font-medium text-ink-900">{t("listHeading")}</h2>
        {rows.length === 0 ? (
          <p className="mt-2 text-sm text-ink-500">{t("empty")}</p>
        ) : (
          <ul className="mt-3 divide-y divide-ink-100 border border-ink-100">
            {rows.map((row) => (
              <li
                key={row.id}
                className="flex flex-wrap items-center justify-between gap-2 px-3 py-2 text-sm"
              >
                <div>
                  <span className="font-mono text-ink-900">{row.email_normalized}</span>
                  {row.note ? (
                    <span className="ml-2 text-ink-500">— {row.note}</span>
                  ) : null}
                </div>
                <button
                  type="button"
                  disabled={busy}
                  onClick={() => void onRemove(row.id)}
                  className="text-xs text-danger hover:underline disabled:opacity-50"
                >
                  {t("remove")}
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
