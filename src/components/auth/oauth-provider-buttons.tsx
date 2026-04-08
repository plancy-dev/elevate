"use client";

const oauthButtonClass =
  "flex items-center justify-center gap-3 h-12 w-full rounded-lg bg-layer-01 border border-border-subtle text-sm text-text-primary hover:bg-layer-02 transition-colors disabled:opacity-50";

function GoogleIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" aria-hidden>
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
  );
}

function MicrosoftIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 23 23" fill="none" aria-hidden>
      <path d="M1 1h10v10H1z" fill="#F25022" />
      <path d="M12 1h10v10H12z" fill="#7FBA00" />
      <path d="M1 12h10v10H1z" fill="#00A4EF" />
      <path d="M12 12h10v10H12z" fill="#FFB900" />
    </svg>
  );
}

/** Google + Microsoft OAuth buttons (shared by login and signup). */
export function OAuthProviderButtons({
  loading,
  onGoogle,
  onAzure,
}: {
  loading: boolean;
  onGoogle: () => void | Promise<void>;
  onAzure: () => void | Promise<void>;
}) {
  return (
    <div className="mt-8 flex flex-col gap-3">
      <button
        type="button"
        disabled={loading}
        onClick={onGoogle}
        className={oauthButtonClass}
      >
        <GoogleIcon className="h-5 w-5" />
        Continue with Google
      </button>
      <button
        type="button"
        disabled={loading}
        onClick={onAzure}
        className={oauthButtonClass}
      >
        <MicrosoftIcon className="h-5 w-5" />
        Continue with Microsoft
      </button>
    </div>
  );
}

/** Horizontal rule with “or” between OAuth and email/password flows. */
export function AuthMethodDivider() {
  return (
    <div className="flex items-center gap-4 my-6">
      <div className="flex-1 h-px bg-border-subtle" />
      <span className="text-xs text-text-tertiary">or</span>
      <div className="flex-1 h-px bg-border-subtle" />
    </div>
  );
}
