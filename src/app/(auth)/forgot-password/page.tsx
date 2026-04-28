import Link from "next/link";
import { ElevateLogo } from "@/components/layout/elevate-logo";
import { ForgotPasswordForm } from "@/components/auth/forgot-password-form";

export const metadata = { title: "Forgot password" };

export default function ForgotPasswordPage() {
  return (
    <div className="flex min-h-screen bg-paper-50">
      <div className="mx-auto flex w-full max-w-[400px] flex-col justify-center px-6 py-16">
        <Link href="/">
          <ElevateLogo size="md" />
        </Link>

        <h1 className="mt-10 text-2xl font-semibold tracking-[-0.02em] text-ink-900">
          Reset password
        </h1>
        <p className="mt-2 text-sm text-ink-500">
          Enter your work email and we&apos;ll send a reset link.
        </p>

        <ForgotPasswordForm />

        <p className="mt-6 text-sm text-ink-500">
          <Link
            href="/login"
            className="text-vermilion-600 transition-colors duration-80 ease-(--ease-editorial) hover:text-vermilion-700"
          >
            Back to log in
          </Link>
        </p>
      </div>
    </div>
  );
}
