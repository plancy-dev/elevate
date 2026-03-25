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
      <ButtonLink href="/login" variant="primary" size="md" className="mt-8">
        Back to log in
      </ButtonLink>
    </div>
  );
}
