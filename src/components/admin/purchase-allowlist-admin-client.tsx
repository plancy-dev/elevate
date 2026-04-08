"use client";

import { useCallback, useState } from "react";
import { useTranslations } from "next-intl";
import {
  addCatalogPurchaseAllowlistEntry,
  listCatalogPurchaseAllowlist,
  removeCatalogPurchaseAllowlistEntry,
  type PurchaseAllowlistRow,
} from "@/actions/purchase-allowlist-admin";

type Props = {
  initialRows: PurchaseAllowlistRow[];
};

export function PurchaseAllowlistAdminClient({ initialRows }: Props) {
  const t = useTranslations("Dashboard.adminPurchaseAllowlist");
  const [rows, setRows] = useState(initialRows);
  const [email, setEmail] = useState("");
  const [note, setNote] = useState("");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const onAdd = useCallback(async () => {
    setMessage(null);
    setBusy(true);
    try {
      const r = await addCatalogPurchaseAllowlistEntry({
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
      const list = await listCatalogPurchaseAllowlist();
      if (list.ok) setRows(list.rows);
    } finally {
      setBusy(false);
    }
  }, [email, note, t]);

  const onRemove = useCallback(
    async (id: string) => {
      setMessage(null);
      setBusy(true);
      try {
        const r = await removeCatalogPurchaseAllowlistEntry(id);
        if (!r.ok) {
          setMessage(r.error);
          return;
        }
        setRows((prev) => prev.filter((x) => x.id !== id));
      } finally {
        setBusy(false);
      }
    },
    [],
  );

  return (
    <div className="max-w-2xl space-y-8">
      <p className="text-sm text-text-secondary leading-relaxed">{t("intro")}</p>

      <div className="space-y-3 rounded-lg border border-border-subtle bg-layer-02/50 p-4 shadow-ambient">
        <div>
          <label htmlFor="allow-email" className="text-xs font-medium text-text-tertiary">
            {t("emailLabel")}
          </label>
          <input
            id="allow-email"
            type="email"
            autoComplete="off"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="mt-1 w-full rounded-lg border border-border-subtle bg-background px-3 py-2 text-sm"
            placeholder="you@company.com"
          />
        </div>
        <div>
          <label htmlFor="allow-note" className="text-xs font-medium text-text-tertiary">
            {t("noteLabel")}
          </label>
          <input
            id="allow-note"
            type="text"
            value={note}
            onChange={(e) => setNote(e.target.value)}
            className="mt-1 w-full rounded-lg border border-border-subtle bg-background px-3 py-2 text-sm"
          />
        </div>
        <button
          type="button"
          disabled={busy || !email.trim()}
          onClick={() => void onAdd()}
          className="rounded-lg bg-primary px-3 py-2 text-sm font-medium text-text-on-color hover:bg-primary-hover disabled:opacity-50"
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
        <h2 className="text-sm font-medium text-text-primary">{t("listHeading")}</h2>
        {rows.length === 0 ? (
          <p className="mt-2 text-sm text-text-tertiary">{t("empty")}</p>
        ) : (
          <ul className="mt-3 divide-y divide-border-subtle rounded-lg border border-border-subtle shadow-ambient">
            {rows.map((row) => (
              <li
                key={row.id}
                className="flex flex-wrap items-center justify-between gap-2 px-3 py-2 text-sm"
              >
                <div>
                  <span className="font-mono text-text-primary">{row.email_normalized}</span>
                  {row.note ? (
                    <span className="ml-2 text-text-tertiary">— {row.note}</span>
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
