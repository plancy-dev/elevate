import Link from "next/link";
import { ElevateLogo } from "@/components/layout/elevate-logo";
import { ButtonLink } from "@/components/ui/button";

export const metadata = { title: "Sign in error" };

export default function AuthCodeErrorPage() {
  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center p-6">
      <Link href="/">
        <ElevateLogo size="md" />
      </Link>
      <h1 className="mt-8 text-xl font-semibold text-text-primary">
        Could not complete sign in
      </h1>
      <p className="mt-2 text-sm text-text-tertiary text-center max-w-md">
        The sign-in link may have expired or already been used. Try again from
        the login page.
      </p>
      <p className="mt-6 max-w-lg text-center text-xs leading-relaxed text-text-tertiary">
        <span className="font-medium text-text-secondary">
          OAuth from localhost but opened on production?
        </span>{" "}
        The PKCE verifier stays on the origin where you started sign-in. Add{" "}
        <code className="rounded bg-layer-02 px-1 py-0.5 text-[11px] text-text-primary">
          http://localhost:3000/auth/callback
        </code>{" "}
        (and{" "}
        <code className="rounded bg-layer-02 px-1 py-0.5 text-[11px] text-text-primary">
          http://127.0.0.1:3000/auth/callback
        </code>{" "}
        if you use it) to Supabase → Authentication → Redirect URLs, then try
        again. See{" "}
        <span className="text-text-secondary">docs/SOCIAL_AUTH.md</span> (PKCE
        section).
      </p>
      <ButtonLink href="/login" variant="primary" size="md" className="mt-8">
        Back to log in
      </ButtonLink>
    </div>
  );
}
