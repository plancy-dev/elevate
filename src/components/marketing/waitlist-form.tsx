"use client";

import { useState } from "react";
import { usePostHog } from "posthog-js/react";
import { useLocale, useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { PostHogEvent } from "@/lib/analytics/posthog-events";
import { cn } from "@/lib/utils";

type WaitlistFormProps = {
  source: "home" | "footer" | "band";
  className?: string;
  /** Larger padding on band/footer variants */
  variant?: "inline" | "panel";
};

export function WaitlistForm({
  source,
  className,
  variant = "inline",
}: WaitlistFormProps) {
  const t = useTranslations("Waitlist");
  const locale = useLocale();
  const posthog = usePostHog();
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">(
    "idle",
  );
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setErrorMessage(null);
    setStatus("loading");
    const form = e.currentTarget;
    const hp = new FormData(form).get("website");
    try {
      const res = await fetch("/api/waitlist", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email,
          locale,
          source,
          website: typeof hp === "string" ? hp : "",
        }),
      });
      const data = (await res.json()) as { ok?: boolean; error?: string };
      if (!res.ok) {
        posthog?.capture(PostHogEvent.ELEVATE_WAITLIST_SUBMIT_FAILED, {
          source,
          locale,
          http_status: res.status,
        });
        setStatus("error");
        setErrorMessage(data.error ?? t("errorGeneric"));
        return;
      }
      posthog?.capture(PostHogEvent.ELEVATE_WAITLIST_SUBMITTED, {
        source,
        locale,
      });
      setStatus("success");
      setEmail("");
    } catch {
      posthog?.capture(PostHogEvent.ELEVATE_WAITLIST_SUBMIT_FAILED, {
        source,
        locale,
        http_status: 0,
      });
      setStatus("error");
      setErrorMessage(t("errorGeneric"));
    }
  }

  if (status === "success") {
    return (
      <p
        className={cn(
          "text-sm text-accent",
          variant === "panel" && "text-white",
          className,
        )}
        role="status"
      >
        {t("success")}
      </p>
    );
  }

  return (
    <div className={cn("w-full", className)}>
      <form
        onSubmit={onSubmit}
        className="flex flex-col gap-3"
      >
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
          <input
            type="text"
            name="website"
            tabIndex={-1}
            autoComplete="off"
            className="sr-only"
            aria-hidden
          />
          <div className="flex-1 min-w-0">
            <label htmlFor={`waitlist-email-${source}`} className="sr-only">
              {t("labelEmail")}
            </label>
            <input
              id={`waitlist-email-${source}`}
              type="email"
              name="email"
              required
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder={t("placeholderEmail")}
              disabled={status === "loading"}
              className={cn(
                "h-10 w-full bg-field border border-border-subtle px-3 text-sm text-text-primary placeholder:text-text-tertiary focus:outline-none focus:border-focus",
                variant === "panel" &&
                  "bg-white/10 border-white/20 text-white placeholder:text-white/50 focus:border-white/40",
              )}
            />
            <p
              className={cn(
                "mt-1.5 text-xs text-text-tertiary",
                variant === "panel" && "text-white/60",
              )}
            >
              {t("hintNewsletter")}
            </p>
          </div>
          <Button
            type="submit"
            variant={variant === "panel" ? "secondary" : "primary"}
            size="lg"
            className={cn(
              "shrink-0 w-full sm:w-auto",
              variant === "panel" &&
                "bg-white text-primary hover:bg-white/90 border-0",
            )}
            isLoading={status === "loading"}
          >
            {t("submit")}
          </Button>
        </div>
        {status === "error" && errorMessage && (
          <p className="text-sm text-danger" role="alert">
            {errorMessage}
          </p>
        )}
      </form>
    </div>
  );
}
