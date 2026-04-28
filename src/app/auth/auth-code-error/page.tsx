import Link from "next/link";
import { ElevateLogo } from "@/components/layout/elevate-logo";
import { ButtonLink } from "@/components/ui/button";

export const metadata = { title: "Sign in error" };

export default function AuthCodeErrorPage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-paper-50 p-6">
      <Link href="/">
        <ElevateLogo size="md" />
      </Link>
      <h1 className="mt-8 text-xl font-semibold text-ink-900">
        Could not complete sign in
      </h1>
      <p className="mt-2 max-w-md text-center text-sm text-ink-500">
        The sign-in link may have expired or already been used. Try again from
        the login page.
      </p>
      <p className="mt-6 max-w-lg text-center text-xs leading-relaxed text-ink-500">
        <span className="font-medium text-ink-700">
          PKCE verifier missing?
        </span>{""}
        The browser must finish OAuth on the same site where you clicked
        sign-in (verifier is stored in cookies for that origin). Common causes:
        another tab or device, cookies cleared or blocked, or Supabase redirecting
        to a different host than where you started. If you develop locally, add{""}
        <code className="border border-ink-100 bg-paper-100 px-1 py-0.5 text-[11px] text-ink-900">
          http://localhost:3000/auth/callback
        </code>{""}
        and{""}
        <code className="border border-ink-100 bg-paper-100 px-1 py-0.5 text-[11px] text-ink-900">
          http://127.0.0.1:3000/auth/callback
        </code>{""}
        under Supabase → Authentication → Redirect URLs. See{""}
        <span className="text-ink-700">docs/SOCIAL_AUTH.md</span> (PKCE
        section).
      </p>
      <ButtonLink href="/login" variant="primary" size="md" className="mt-8">
        Back to log in
      </ButtonLink>
    </div>
  );
}
