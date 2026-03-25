"use client";

import { useState, type FormEvent } from "react";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";

function getRecoveryRedirectUrl() {
  const origin =
    typeof window !== "undefined"
      ? window.location.origin
      : process.env.NEXT_PUBLIC_APP_URL ?? "";
  return `${origin}/auth/callback?next=${encodeURIComponent("/dashboard")}`;
}

export function ForgotPasswordForm() {
  const [email, setEmail] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setMessage(null);
    setLoading(true);
    const supabase = createClient();
    const { error: err } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: getRecoveryRedirectUrl(),
    });
    setLoading(false);
    if (err) {
      setError(err.message);
      return;
    }
    setMessage(
      "If an account exists for this email, you will receive a reset link shortly.",
    );
  }

  return (
    <>
      {error && (
        <p className="mb-4 rounded-sm border border-danger/40 bg-danger/10 px-3 py-2 text-xs text-danger">
          {error}
        </p>
      )}
      {message && (
        <p className="mb-4 rounded-sm border border-accent/40 bg-accent/10 px-3 py-2 text-xs text-text-secondary">
          {message}
        </p>
      )}

      <form className="mt-8 flex flex-col gap-4" onSubmit={onSubmit}>
        <div>
          <label
            htmlFor="email"
            className="block text-xs font-medium text-text-secondary mb-1.5"
          >
            Work email
          </label>
          <input
            id="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            autoComplete="email"
            required
            placeholder="you@company.com"
            className="h-10 w-full bg-field border border-border-subtle px-3 text-sm text-text-primary placeholder:text-text-tertiary focus:outline-none focus:border-focus transition-colors"
          />
        </div>
        <Button
          variant="primary"
          size="lg"
          disabled={loading}
          isLoading={loading}
          type="submit"
        >
          Send reset link
        </Button>
      </form>
    </>
  );
}
