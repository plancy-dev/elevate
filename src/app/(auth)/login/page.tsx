import { Suspense } from "react";
import Link from "next/link";
import { ElevateLogo } from "@/components/layout/elevate-logo";
import { ThemeToggleEnglish } from "@/components/layout/theme-toggle";
import { LoginForm } from "@/components/auth/login-form";

export const metadata = { title: "Log In" };

function LoginFormFallback() {
  return (
    <div className="mt-8 h-80 animate-pulse bg-paper-100" aria-hidden />
  );
}

export default function LoginPage() {
  return (
    <div className="relative flex min-h-screen bg-paper-50">
      <div className="absolute right-4 top-4 z-10">
        <ThemeToggleEnglish />
      </div>
      <div className="hidden flex-col justify-between border-r border-ink-100 bg-marketing-canvas p-10 lg:flex lg:w-[480px] xl:w-[560px]">
        <Link href="/">
          <ElevateLogo size="md" />
        </Link>

        <div>
          <h1 className="text-[32px] font-semibold leading-tight tracking-[-0.02em] text-ink-900">
            E-books, Library,
            <br />
            and your org workspace.
          </h1>
          <p className="mt-4 max-w-sm text-sm leading-relaxed text-ink-500">
            Sign in to access purchases, downloads, and organization tools—not a
            mandatory product tour.
          </p>
        </div>

        <p className="text-xs text-ink-500">
          Enterprise security and compliance posture depend on your deployment
          and configuration—ask us for details.
        </p>
      </div>

      <div className="flex flex-1 items-center justify-center p-6">
        <div className="w-full max-w-[400px]">
          <div className="mb-8 lg:hidden">
            <Link href="/">
              <ElevateLogo size="md" />
            </Link>
          </div>

          <h2 className="text-2xl font-semibold tracking-[-0.02em] text-ink-900">
            Log in to Elevate
          </h2>
          <p className="mt-2 text-sm text-ink-500">
            Need an account for purchases?{""}
            <Link
              href="/signup"
              className="text-vermilion-600 transition-colors duration-80 ease-(--ease-editorial) hover:text-vermilion-700"
            >
              Create one
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
