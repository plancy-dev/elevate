import Link from "next/link";
import { ElevateLogo } from "@/components/layout/elevate-logo";
import { ThemeToggleEnglish } from "@/components/layout/theme-toggle";
import { SignupForm } from "@/components/auth/signup-form";

export const metadata = { title: "Create account" };

export default function SignupPage() {
  return (
    <div className="relative flex min-h-screen bg-paper-50">
      <div className="absolute right-4 top-4 z-10">
        <ThemeToggleEnglish />
      </div>
      <div className="mx-auto flex w-full max-w-[400px] flex-col justify-center px-6 py-16">
        <Link href="/">
          <ElevateLogo size="md" />
        </Link>

        <h1 className="mt-10 text-2xl font-semibold tracking-[-0.02em] text-ink-900">
          Create account
        </h1>
        <p className="mt-2 text-sm leading-relaxed text-ink-700">
          For purchasing e-books, org Library downloads, and billing—not a gated
          product demo.
        </p>
        <p className="mt-2 text-sm text-ink-500">
          Already have an account?{""}
          <Link
            href="/login"
            className="text-vermilion-600 transition-colors duration-80 ease-(--ease-editorial) hover:text-vermilion-700"
          >
            Log in
          </Link>
        </p>

        <SignupForm />
      </div>
    </div>
  );
}
