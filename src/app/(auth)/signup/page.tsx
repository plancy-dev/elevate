import Link from "next/link";
import { ElevateLogo } from "@/components/layout/elevate-logo";
import { ThemeToggleEnglish } from "@/components/layout/theme-toggle";
import { SignupForm } from "@/components/auth/signup-form";

export const metadata = { title: "Create account" };

export default function SignupPage() {
  return (
    <div className="relative min-h-screen bg-background flex">
      <div className="absolute right-4 top-4 z-10">
        <ThemeToggleEnglish />
      </div>
      <div className="mx-auto flex w-full max-w-[400px] flex-col justify-center px-6 py-16">
        <Link href="/">
          <ElevateLogo size="md" />
        </Link>

        <h1 className="mt-10 text-2xl font-semibold tracking-[-0.02em] text-text-primary">
          Create account
        </h1>
        <p className="mt-2 text-sm text-text-tertiary">
          Already have an account?{" "}
          <Link
            href="/login"
            className="text-interactive hover:text-primary transition-colors"
          >
            Log in
          </Link>
        </p>

        <SignupForm />
      </div>
    </div>
  );
}
