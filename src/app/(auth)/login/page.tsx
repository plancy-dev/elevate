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
            Join 1,200+ event professionals who manage $300M+ in event revenue
            through Elevate.
          </p>

          <div className="mt-10 grid grid-cols-2 gap-4">
            {[
              { value: "15,495", label: "Attendees managed" },
              { value: "284", label: "Active events" },
              { value: "40%", label: "Efficiency gain" },
              { value: "99.9%", label: "Uptime SLA" },
            ].map((stat) => (
              <div key={stat.label}>
                <div className="text-xl font-semibold text-text-primary">
                  {stat.value}
                </div>
                <div className="text-xs text-text-tertiary">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>

        <div className="flex items-center gap-4">
          <span className="text-xs text-text-tertiary">SOC 2</span>
          <span className="text-xs text-text-tertiary">GDPR</span>
          <span className="text-xs text-text-tertiary">ISO 27001</span>
        </div>
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
