"use client";

import { useEffect, useState, type FormEvent } from "react";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { formatAuthError } from "@/lib/auth-errors";
import { getAuthCallbackUrl } from "@/lib/auth-redirect-urls";
import { Button } from "@/components/ui/button";

function formatOAuthCallbackError(
  code: string,
  description: string | null,
  errorCode?: string | null,
): string {
  const d = description?.replace(/\+/g, " ").trim() ?? "";
  if (
    errorCode === "otp_expired" ||
    (code === "access_denied" &&
      /(invalid or has expired|email link)/i.test(d))
  ) {
    return (
      "This password reset or email link has expired or was already used. " +
      "Request a new reset from Forgot password and open the latest email link within about an hour."
    );
  }
  if (code === "access_denied") {
    return "Sign-in was cancelled. Try again when you’re ready.";
  }
  if (/space/i.test(d) || /client/i.test(d)) {
    return "Provider configuration failed. In Supabase: Google Client IDs must have no spaces (comma-separated only). Check Azure Client ID, secret Value, and Tenant URL.";
  }
  if (d.length > 0) return d;
  return `Sign-in failed (${code}). Check Google and Microsoft settings in Supabase and your provider consoles.`;
}

export function LoginForm() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const next = searchParams.get("next")?.startsWith("/")
    ? searchParams.get("next")!
    : "/dashboard";

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [oauthBanner, setOauthBanner] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const authError = searchParams.get("auth_error");
    if (!authError) return;

    const desc = searchParams.get("auth_error_description");
    const authErrorCode = searchParams.get("auth_error_code");
    const msg = formatOAuthCallbackError(authError, desc, authErrorCode);
    const sp = searchParams.toString();

    queueMicrotask(() => {
      setOauthBanner(msg);
      const params = new URLSearchParams(sp);
      params.delete("auth_error");
      params.delete("auth_error_description");
      params.delete("auth_error_code");
      const q = params.toString();
      router.replace(q ? `${pathname}?${q}` : pathname, { scroll: false });
    });
  }, [searchParams, pathname, router]);

  async function signInWithGoogle() {
    setError(null);
    setOauthBanner(null);
    setLoading(true);
    const supabase = createClient();
    const { error: err } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: getAuthCallbackUrl(next),
        queryParams: { prompt: "select_account" },
      },
    });
    setLoading(false);
    if (err) setError(err.message);
  }

  async function signInWithAzure() {
    setError(null);
    setOauthBanner(null);
    setLoading(true);
    const supabase = createClient();
    const { error: err } = await supabase.auth.signInWithOAuth({
      provider: "azure",
      options: { redirectTo: getAuthCallbackUrl(next) },
    });
    setLoading(false);
    if (err) setError(err.message);
  }

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    const supabase = createClient();
    const normalizedEmail = email.trim().toLowerCase();
    const { error: err } = await supabase.auth.signInWithPassword({
      email: normalizedEmail,
      password,
    });
    setLoading(false);
    if (err) {
      setError(formatAuthError(err));
      return;
    }
    router.push(next);
    router.refresh();
  }

  return (
    <>
      {oauthBanner && (
        <p className="mb-4 rounded-sm border border-border-subtle bg-layer-02 px-3 py-2 text-xs text-text-secondary">
          {oauthBanner}
        </p>
      )}
      {error && (
        <p className="mb-4 rounded-sm border border-danger/40 bg-danger/10 px-3 py-2 text-xs text-danger">
          {error}
        </p>
      )}

      <div className="mt-8 flex flex-col gap-3">
        <button
          type="button"
          disabled={loading}
          onClick={signInWithGoogle}
          className="flex items-center justify-center gap-3 h-12 w-full bg-layer-01 border border-border-subtle text-sm text-text-primary hover:bg-layer-02 transition-colors disabled:opacity-50"
        >
          <svg className="h-5 w-5" viewBox="0 0 24 24">
            <path
              d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z"
              fill="#4285F4"
            />
            <path
              d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              fill="#34A853"
            />
            <path
              d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
              fill="#FBBC05"
            />
            <path
              d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
              fill="#EA4335"
            />
          </svg>
          Continue with Google
        </button>

        <button
          type="button"
          disabled={loading}
          onClick={signInWithAzure}
          className="flex items-center justify-center gap-3 h-12 w-full bg-layer-01 border border-border-subtle text-sm text-text-primary hover:bg-layer-02 transition-colors disabled:opacity-50"
        >
          <svg className="h-5 w-5" viewBox="0 0 23 23" fill="none">
            <path d="M1 1h10v10H1z" fill="#F25022" />
            <path d="M12 1h10v10H12z" fill="#7FBA00" />
            <path d="M1 12h10v10H1z" fill="#00A4EF" />
            <path d="M12 12h10v10H12z" fill="#FFB900" />
          </svg>
          Continue with Microsoft
        </button>
      </div>

      <div className="flex items-center gap-4 my-6">
        <div className="flex-1 h-px bg-border-subtle" />
        <span className="text-xs text-text-tertiary">or</span>
        <div className="flex-1 h-px bg-border-subtle" />
      </div>

      <form className="flex flex-col gap-4" onSubmit={onSubmit}>
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
          <div className="flex items-center justify-between mb-1.5">
            <label
              htmlFor="password"
              className="block text-xs font-medium text-text-secondary"
            >
              Password
            </label>
            <Link
              href="/forgot-password"
              className="text-xs text-interactive hover:text-primary transition-colors"
            >
              Forgot password?
            </Link>
          </div>
          <input
            id="password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoComplete="current-password"
            required
            placeholder="••••••••"
            className="h-10 w-full bg-field border border-border-subtle px-3 text-sm text-text-primary placeholder:text-text-tertiary focus:outline-none focus:border-focus transition-colors"
          />
        </div>

        <Button variant="primary" size="lg" className="w-full mt-2" disabled={loading} isLoading={loading} type="submit">
          Log In
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
