import Link from "next/link";
import { ElevateLogo } from "@/components/layout/elevate-logo";
import { ThemeToggleEnglish } from "@/components/layout/theme-toggle";
import { UpdatePasswordForm } from "@/components/auth/update-password-form";

export const metadata = { title: "Set new password" };

export default function UpdatePasswordPage() {
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
          Set a new password
        </h1>
        <p className="mt-2 text-sm text-ink-500">
          Choose a strong password for your account.
        </p>

        <UpdatePasswordForm />

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
