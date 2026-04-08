"use client";

import { useCallback, useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { createClient } from "@/lib/supabase/client";
import { getAuthCallbackUrl } from "@/lib/auth-redirect-urls";
import { MICROSOFT_ENTRA_OAUTH_SCOPES } from "@/lib/auth/oauth-sign-in";

type Identity = { provider: string; id?: string };

export function ConnectedIdentities() {
  const t = useTranslations("Dashboard.connectedAccounts");
  const [identities, setIdentities] = useState<Identity[]>([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState<string | null>(null);
  const [busy, setBusy] = useState<string | null>(null);

  function providerLabel(provider: string): string {
    if (provider === "google") return t("providerGoogle");
    if (provider === "azure") return t("providerMicrosoft");
    if (provider === "email") return t("providerEmail");
    return t("providerOther", { provider });
  }

  const refresh = useCallback(async () => {
    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    const list =
      user?.identities?.map((i) => ({
        provider: i.provider,
        id: i.identity_id,
      })) ?? [];
    setIdentities(list);
    setLoading(false);
  }, []);

  useEffect(() => {
    queueMicrotask(() => {
      void refresh();
    });
  }, [refresh]);

  const hasGoogle = identities.some((i) => i.provider === "google");
  const hasAzure = identities.some((i) => i.provider === "azure");

  async function linkProvider(provider: "google" | "azure") {
    setMessage(null);
    setBusy(provider);
    const supabase = createClient();
    const { error } = await supabase.auth.linkIdentity({
      provider,
      options: {
        redirectTo: getAuthCallbackUrl("/dashboard/settings"),
        ...(provider === "azure"
          ? { scopes: MICROSOFT_ENTRA_OAUTH_SCOPES }
          : {}),
      },
    });
    setBusy(null);
    if (error) {
      setMessage(
        error.message.includes("manual linking")
          ? t("linkManualHint")
          : error.message,
      );
    }
  }

  if (loading) {
    return <p className="text-xs text-text-tertiary">{t("loading")}</p>;
  }

  return (
    <div className="space-y-3">
      <p className="text-xs text-text-tertiary leading-relaxed">{t("intro")}</p>
      <ul className="text-sm text-text-secondary space-y-1">
        {identities.length === 0 ? (
          <li>—</li>
        ) : (
          identities.map((i) => (
            <li key={`${i.provider}-${i.id ?? i.provider}`}>
              {providerLabel(i.provider)}
            </li>
          ))
        )}
      </ul>
      {message ? (
        <p className="text-xs text-danger border border-danger/40 bg-danger/10 px-3 py-2 rounded-md">
          {message}
        </p>
      ) : null}
      <div className="flex flex-wrap gap-2">
        {!hasGoogle ? (
          <button
            type="button"
            disabled={busy !== null}
            onClick={() => void linkProvider("google")}
            className="text-xs px-3 py-1.5 border border-border-subtle bg-layer-01 hover:bg-layer-02 text-text-primary disabled:opacity-50"
          >
            {busy === "google" ? t("redirecting") : t("linkGoogle")}
          </button>
        ) : null}
        {!hasAzure ? (
          <button
            type="button"
            disabled={busy !== null}
            onClick={() => void linkProvider("azure")}
            className="text-xs px-3 py-1.5 border border-border-subtle bg-layer-01 hover:bg-layer-02 text-text-primary disabled:opacity-50"
          >
            {busy === "azure" ? t("redirecting") : t("linkMicrosoft")}
          </button>
        ) : null}
      </div>
    </div>
  );
}
