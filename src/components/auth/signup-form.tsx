"use client";

import { useState, type FormEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { formatAuthError, formatUnknownAuthError } from "@/lib/auth-errors";
import { signInWithOAuthProvider } from "@/lib/auth/oauth-sign-in";
import {
  DEFAULT_POST_LOGIN_PATH,
  getAuthCallbackUrl,
} from "@/lib/auth-redirect-urls";
import {
  AuthMethodDivider,
  OAuthProviderButtons,
} from "@/components/auth/oauth-provider-buttons";
import { Button } from "@/components/ui/button";

export function SignupForm() {
  const router = useRouter();
  const next = DEFAULT_POST_LOGIN_PATH;

  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function signUpWithGoogle() {
    setError(null);
    setMessage(null);
    setLoading(true);
    try {
      const supabase = createClient();
      const { error: err } = await signInWithOAuthProvider(supabase, {
        provider: "google",
        redirectTo: getAuthCallbackUrl(next),
      });
      if (err) setError(formatAuthError(err));
    } catch (e) {
      setError(formatUnknownAuthError(e));
    } finally {
      setLoading(false);
    }
  }

  async function signUpWithAzure() {
    setError(null);
    setMessage(null);
    setLoading(true);
    try {
      const supabase = createClient();
      const { error: err } = await signInWithOAuthProvider(supabase, {
        provider: "azure",
        redirectTo: getAuthCallbackUrl(next),
      });
      if (err) setError(formatAuthError(err));
    } catch (e) {
      setError(formatUnknownAuthError(e));
    } finally {
      setLoading(false);
    }
  }

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setMessage(null);
    setLoading(true);
    const supabase = createClient();
    const normalizedEmail = email.trim().toLowerCase();
    try {
      const { error: err } = await supabase.auth.signUp({
        email: normalizedEmail,
        password,
        options: {
          emailRedirectTo: getAuthCallbackUrl(next),
          data: { full_name: fullName },
        },
      });
      setLoading(false);
      if (err) {
        setError(formatAuthError(err));
        return;
      }
      setMessage(
        "Check your email to confirm your account, then you can sign in.",
      );
      router.refresh();
    } catch (e) {
      setLoading(false);
      setError(formatUnknownAuthError(e));
    }
  }

  return (
    <>
      {error && (
        <p className="mb-4 rounded-sm border border-danger/40 bg-danger/10 px-3 py-2 text-xs text-danger">
          {error}
        </p>
      )}
      {message && (
        <p className="mb-4 rounded-sm border border-accent/40 bg-accent/10 px-3 py-2 text-xs text-accent">
          {message}
        </p>
      )}

      <OAuthProviderButtons
        loading={loading}
        onGoogle={signUpWithGoogle}
        onAzure={signUpWithAzure}
      />

      <AuthMethodDivider />

      <form className="flex flex-col gap-4" onSubmit={onSubmit}>
        <div>
          <label
            htmlFor="full_name"
            className="block text-xs font-medium text-text-secondary mb-1.5"
          >
            Full name
          </label>
          <input
            id="full_name"
            type="text"
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            autoComplete="name"
            required
            placeholder="Jane Doe"
            className="h-10 w-full bg-field border border-border-subtle px-3 text-sm text-text-primary placeholder:text-text-tertiary focus:outline-none focus:border-focus transition-colors"
          />
        </div>

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

        <div>
          <label
            htmlFor="password"
            className="block text-xs font-medium text-text-secondary mb-1.5"
          >
            Password
          </label>
          <input
            id="password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoComplete="new-password"
            required
            minLength={8}
            placeholder="At least 8 characters"
            className="h-10 w-full bg-field border border-border-subtle px-3 text-sm text-text-primary placeholder:text-text-tertiary focus:outline-none focus:border-focus transition-colors"
          />
        </div>

        <Button
          variant="primary"
          size="lg"
          className="w-full mt-2"
          disabled={loading}
          isLoading={loading}
          type="submit"
        >
          Create account
        </Button>
      </form>

      <p className="mt-6 text-xs text-text-tertiary text-center leading-relaxed">
        By continuing, you agree to our{" "}
        <Link
          href="/terms"
          className="text-interactive hover:text-primary transition-colors"
        >
          Terms of Service
        </Link>{" "}
        and{" "}
        <Link
          href="/privacy"
          className="text-interactive hover:text-primary transition-colors"
        >
          Privacy Policy
        </Link>
        .
      </p>
    </>
  );
}
