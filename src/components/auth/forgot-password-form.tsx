"use client";

import { useState, type FormEvent } from "react";
import { createClient } from "@/lib/supabase/client";
import {
  AUTH_UPDATE_PASSWORD_PATH,
  getAuthCallbackUrl,
} from "@/lib/auth-redirect-urls";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { formatAuthEmailDeliveryError } from "@/lib/auth-errors";

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
    const normalizedEmail = email.trim().toLowerCase();
    const { error: err } = await supabase.auth.resetPasswordForEmail(
      normalizedEmail,
      {
        redirectTo: getAuthCallbackUrl(AUTH_UPDATE_PASSWORD_PATH),
      },
    );
    setLoading(false);
    if (err) {
      setError(formatAuthEmailDeliveryError(err));
      return;
    }
    setMessage(
      "If an account exists for this email, you will receive a reset link shortly.",
    );
  }

  return (
    <>
      {error && (
        <p className="mb-4 border border-vermilion-300 bg-vermilion-50 px-3 py-2 text-xs text-vermilion-700">
          {error}
        </p>
      )}
      {message && (
        <p className="mb-4 border border-vermilion-300 bg-vermilion-50 px-3 py-2 text-xs text-ink-700">
          {message}
        </p>
      )}

      <form className="mt-8 flex flex-col gap-4" onSubmit={onSubmit}>
        <div>
          <label
            htmlFor="email"
              className="mb-1.5 block text-xs font-medium text-ink-700"
          >
            Work email
          </label>
          <Input
            id="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            autoComplete="email"
            required
            placeholder="you@company.com"
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
