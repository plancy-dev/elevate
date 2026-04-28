"use client";

import { useEffect, useState, type FormEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { DEFAULT_POST_LOGIN_PATH } from "@/lib/auth-redirect-urls";
import { clearRecoveryPendingClient } from "@/lib/auth-recovery-cookie";
import { logAuthFlow } from "@/lib/auth-flow-log";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export function UpdatePasswordForm() {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [sessionChecked, setSessionChecked] = useState(false);
  const [hasSession, setHasSession] = useState(false);

  useEffect(() => {
    const supabase = createClient();
    void supabase.auth.getSession().then(({ data: { session } }) => {
      logAuthFlow("auth.update_password.mount", {
        hasSession: Boolean(session),
      });
      setSessionChecked(true);
      setHasSession(!!session);
    });
  }, []);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    if (password.length < 8) {
      setError("Password must be at least 8 characters.");
      return;
    }
    if (password !== confirm) {
      setError("Passwords do not match.");
      return;
    }
    setLoading(true);
    const supabase = createClient();
    const { error: err } = await supabase.auth.updateUser({ password });
    if (err) {
      setLoading(false);
      setError(err.message);
      return;
    }
    const { error: refreshErr } = await supabase.auth.refreshSession();
    setLoading(false);
    if (refreshErr) {
      logAuthFlow("auth.update_password.refresh_warn", {
        message: refreshErr.message.slice(0, 200),
      });
    }
    clearRecoveryPendingClient();
    router.push(DEFAULT_POST_LOGIN_PATH);
    router.refresh();
  }

  if (!sessionChecked) {
    return (
      <div className="mt-8 h-40 animate-pulse bg-paper-100" aria-hidden />
    );
  }

  if (!hasSession) {
    return (
      <p className="mt-8 text-sm leading-relaxed text-ink-700">
        This link is invalid or your session expired.{""}
        <Link
          href="/forgot-password"
          className="text-vermilion-600 transition-colors duration-80 ease-(--ease-editorial) hover:text-vermilion-700"
        >
          Request a new reset email
        </Link>{""}
        or{""}
        <Link
          href="/login"
          className="text-vermilion-600 transition-colors duration-80 ease-(--ease-editorial) hover:text-vermilion-700"
        >
          log in
        </Link>
        .
      </p>
    );
  }

  return (
    <form className="mt-8 flex flex-col gap-4" onSubmit={onSubmit}>
      {error && (
        <p className="border border-vermilion-300 bg-vermilion-50 px-3 py-2 text-xs text-vermilion-700">
          {error}
        </p>
      )}
      <div>
        <label
          htmlFor="new-password"
          className="mb-1.5 block text-xs font-medium text-ink-700"
        >
          New password
        </label>
        <Input
          id="new-password"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          autoComplete="new-password"
          required
          minLength={8}
        />
      </div>
      <div>
        <label
          htmlFor="confirm-password"
          className="mb-1.5 block text-xs font-medium text-ink-700"
        >
          Confirm password
        </label>
        <Input
          id="confirm-password"
          type="password"
          value={confirm}
          onChange={(e) => setConfirm(e.target.value)}
          autoComplete="new-password"
          required
          minLength={8}
        />
      </div>
      <Button
        variant="primary"
        size="lg"
        disabled={loading}
        isLoading={loading}
        type="submit"
        className="mt-2"
      >
        Update password
      </Button>
    </form>
  );
}
