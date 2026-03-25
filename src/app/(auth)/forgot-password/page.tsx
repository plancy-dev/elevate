import Link from "next/link";
import { ElevateLogo } from "@/components/layout/elevate-logo";
import { ForgotPasswordForm } from "@/components/auth/forgot-password-form";

export const metadata = { title: "Forgot password" };

export default function ForgotPasswordPage() {
  return (
    <div className="min-h-screen bg-background flex">
      <div className="mx-auto flex w-full max-w-[400px] flex-col justify-center px-6 py-16">
        <Link href="/">
          <ElevateLogo size="md" />
        </Link>

        <h1 className="mt-10 text-2xl font-semibold tracking-[-0.02em] text-text-primary">
          Reset password
        </h1>
        <p className="mt-2 text-sm text-text-tertiary">
          Enter your work email and we&apos;ll send a reset link.
        </p>

        <ForgotPasswordForm />

        <p className="mt-6 text-sm text-text-tertiary">
          <Link
            href="/login"
            className="text-interactive hover:text-primary transition-colors"
          >
            Back to log in
          </Link>
        </p>
      </div>
    </div>
  );
}
