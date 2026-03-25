import { Suspense } from "react";
import Link from "next/link";
import { ElevateLogo } from "@/components/layout/elevate-logo";
import { LoginForm } from "@/components/auth/login-form";

export const metadata = { title: "Log In" };

function LoginFormFallback() {
  return (
    <div className="mt-8 h-80 animate-pulse rounded-sm bg-layer-01/50" aria-hidden />
  );
}

export default function LoginPage() {
  return (
    <div className="min-h-screen bg-background flex">
      <div className="hidden lg:flex lg:w-[480px] xl:w-[560px] flex-col justify-between bg-layer-01 border-r border-border-subtle p-10">
        <Link href="/">
          <ElevateLogo size="md" />
        </Link>

        <div>
          <h1 className="text-[32px] font-semibold leading-tight tracking-[-0.02em] text-text-primary">
            Orchestrate world-class
            <br />
            events at scale.
          </h1>
          <p className="mt-4 text-sm text-text-tertiary leading-relaxed max-w-sm">
            Sign in to manage your organization&apos;s events, venues, and
            attendees in Elevate.
          </p>
        </div>

        <p className="text-xs text-text-tertiary">
          Enterprise security and compliance posture depend on your deployment
          and configuration—ask us for details.
        </p>
      </div>

      <div className="flex-1 flex items-center justify-center p-6">
        <div className="w-full max-w-[400px]">
          <div className="lg:hidden mb-8">
            <Link href="/">
              <ElevateLogo size="md" />
            </Link>
          </div>

          <h2 className="text-2xl font-semibold tracking-[-0.02em] text-text-primary">
            Log in to Elevate
          </h2>
          <p className="mt-2 text-sm text-text-tertiary">
            Don&apos;t have an account?{" "}
            <Link
              href="/signup"
              className="text-interactive hover:text-primary transition-colors"
            >
              Request access
            </Link>
          </p>

          <Suspense fallback={<LoginFormFallback />}>
            <LoginForm />
          </Suspense>
        </div>
      </div>
    </div>
  );
}
