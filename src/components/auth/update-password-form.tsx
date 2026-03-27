"use client";

import { useEffect, useState, type FormEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { DEFAULT_POST_LOGIN_PATH } from "@/lib/auth-redirect-urls";
import { logAuthFlow } from "@/lib/auth-flow-log";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";

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
    setLoading(false);
    if (err) {
      setError(err.message);
      return;
    }
    router.push(DEFAULT_POST_LOGIN_PATH);
    router.refresh();
  }

  if (!sessionChecked) {
    return (
      <div className="mt-8 h-40 animate-pulse rounded-sm bg-layer-01/50" aria-hidden />
    );
  }

  if (!hasSession) {
    return (
      <p className="mt-8 text-sm text-text-secondary leading-relaxed">
        This link is invalid or your session expired.{" "}
        <Link
          href="/forgot-password"
          className="text-interactive hover:text-primary transition-colors"
        >
          Request a new reset email
        </Link>{" "}
        or{" "}
        <Link
          href="/login"
          className="text-interactive hover:text-primary transition-colors"
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
        <p className="rounded-sm border border-danger/40 bg-danger/10 px-3 py-2 text-xs text-danger">
          {error}
        </p>
      )}
      <div>
        <label
          htmlFor="new-password"
          className="block text-xs font-medium text-text-secondary mb-1.5"
        >
          New password
        </label>
        <input
          id="new-password"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          autoComplete="new-password"
          required
          minLength={8}
          className="h-10 w-full bg-field border border-border-subtle px-3 text-sm text-text-primary placeholder:text-text-tertiary focus:outline-none focus:border-focus transition-colors"
        />
      </div>
      <div>
        <label
          htmlFor="confirm-password"
          className="block text-xs font-medium text-text-secondary mb-1.5"
        >
          Confirm password
        </label>
        <input
          id="confirm-password"
          type="password"
          value={confirm}
          onChange={(e) => setConfirm(e.target.value)}
          autoComplete="new-password"
          required
          minLength={8}
          className="h-10 w-full bg-field border border-border-subtle px-3 text-sm text-text-primary placeholder:text-text-tertiary focus:outline-none focus:border-focus transition-colors"
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
