"use client";

import { useCallback, useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { getAuthCallbackUrl } from "@/lib/auth-redirect-urls";

type Identity = { provider: string; id?: string };

function providerLabel(provider: string): string {
  if (provider === "google") return "Google";
  if (provider === "azure") return "Microsoft";
  if (provider === "email") return "Email & password";
  return provider;
}

export function ConnectedIdentities() {
  const [identities, setIdentities] = useState<Identity[]>([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState<string | null>(null);
  const [busy, setBusy] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
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
      },
    });
    setBusy(null);
    if (error) {
      setMessage(
        error.message.includes("manual linking")
          ? "Enable manual identity linking in Supabase Authentication settings, or use the same email with automatic linking enabled."
          : error.message,
      );
    }
  }

  if (loading) {
    return (
      <p className="text-xs text-text-tertiary">Loading connected accounts…</p>
    );
  }

  return (
    <div className="space-y-3">
      <p className="text-xs text-text-tertiary leading-relaxed">
        Sign in methods linked to your email. If you use the same email with
        Google or Microsoft as with your password, Supabase can merge them when
        automatic account linking is enabled in the project.
      </p>
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
      {message && (
        <p className="text-xs text-danger border border-danger/40 bg-danger/10 px-3 py-2 rounded-sm">
          {message}
        </p>
      )}
      <div className="flex flex-wrap gap-2">
        {!hasGoogle ? (
          <button
            type="button"
            disabled={busy !== null}
            onClick={() => void linkProvider("google")}
            className="text-xs px-3 py-1.5 border border-border-subtle bg-layer-01 hover:bg-layer-02 text-text-primary disabled:opacity-50"
          >
            {busy === "google" ? "Redirecting…" : "Link Google"}
          </button>
        ) : null}
        {!hasAzure ? (
          <button
            type="button"
            disabled={busy !== null}
            onClick={() => void linkProvider("azure")}
            className="text-xs px-3 py-1.5 border border-border-subtle bg-layer-01 hover:bg-layer-02 text-text-primary disabled:opacity-50"
          >
            {busy === "azure" ? "Redirecting…" : "Link Microsoft"}
          </button>
        ) : null}
      </div>
    </div>
  );
}
