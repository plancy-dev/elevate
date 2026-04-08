"use client";

import { useEffect, useState, type FormEvent } from "react";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import {
  formatAuthError,
  formatOAuthCallbackError,
  formatSignInPasswordError,
  formatUnknownAuthError,
} from "@/lib/auth-errors";
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
import { Input } from "@/components/ui/input";

export function LoginForm() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const next = searchParams.get("next")?.startsWith("/")
    ? searchParams.get("next")!
    : DEFAULT_POST_LOGIN_PATH;

  const [authMode, setAuthMode] = useState<"password" | "magic">("password");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [magicMessage, setMagicMessage] = useState<string | null>(null);
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

  async function signInWithAzure() {
    setError(null);
    setOauthBanner(null);
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
    setMagicMessage(null);
    setLoading(true);
    const supabase = createClient();
    const normalizedEmail = email.trim().toLowerCase();

    try {
      if (authMode === "magic") {
        const { error: err } = await supabase.auth.signInWithOtp({
          email: normalizedEmail,
          options: {
            emailRedirectTo: getAuthCallbackUrl(next),
            shouldCreateUser: false,
          },
        });
        setLoading(false);
        if (err) {
          setError(formatAuthError(err));
          return;
        }
        setMagicMessage(
          "If an account exists for this email, you will receive a sign-in link shortly. Open it on this device within about an hour.",
        );
        return;
      }

      const { data, error: err } = await supabase.auth.signInWithPassword({
        email: normalizedEmail,
        password,
      });
      if (err) {
        setLoading(false);
        setError(formatSignInPasswordError(err));
        return;
      }
      if (!data.session) {
        setLoading(false);
        setError(
          "Sign-in returned no session. Refresh and try again, or check Supabase Auth status.",
        );
        return;
      }
      // Keep loading until navigation unmounts this page (`router.push` has no completion callback).
      router.push(next);
      router.refresh();
    } catch (e) {
      setLoading(false);
      setError(formatUnknownAuthError(e));
    }
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

      <OAuthProviderButtons
        loading={loading}
        onGoogle={signInWithGoogle}
        onAzure={signInWithAzure}
      />

      <AuthMethodDivider />

      <div
        className="mb-4 flex rounded-sm border border-border-subtle p-0.5"
        role="tablist"
        aria-label="Sign-in method"
      >
        <button
          type="button"
          role="tab"
          aria-selected={authMode === "password"}
          className={`flex-1 rounded-sm px-3 py-2 text-xs font-medium transition-colors ${
            authMode === "password"
              ? "bg-layer-01 text-text-primary"
              : "text-text-tertiary hover:text-text-secondary"
          }`}
          onClick={() => {
            setAuthMode("password");
            setMagicMessage(null);
          }}
        >
          Password
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={authMode === "magic"}
          className={`flex-1 rounded-sm px-3 py-2 text-xs font-medium transition-colors ${
            authMode === "magic"
              ? "bg-layer-01 text-text-primary"
              : "text-text-tertiary hover:text-text-secondary"
          }`}
          onClick={() => {
            setAuthMode("magic");
            setMagicMessage(null);
          }}
        >
          Magic link
        </button>
      </div>

      {magicMessage && (
        <p className="mb-4 rounded-sm border border-accent/40 bg-accent/10 px-3 py-2 text-xs text-text-secondary">
          {magicMessage}
        </p>
      )}

      <form className="flex flex-col gap-4" onSubmit={onSubmit}>
        <div>
          <label
            htmlFor="email"
            className="block text-xs font-medium text-text-secondary mb-1.5"
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

        {authMode === "password" && (
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
            <Input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="current-password"
              required
              placeholder="••••••••"
            />
          </div>
        )}

        <Button variant="primary" size="lg" className="w-full mt-2" disabled={loading} isLoading={loading} type="submit">
          {authMode === "magic" ? "Email me a sign-in link" : "Log In"}
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
