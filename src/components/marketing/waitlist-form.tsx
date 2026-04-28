"use client";

import { useRef, useState } from "react";
import { usePostHog } from "posthog-js/react";
import { useLocale, useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { PostHogEvent } from "@/lib/analytics/posthog-events";
import { cn } from "@/lib/utils";
import { WAITLIST_API_PATH, type WaitlistSource } from "@/lib/waitlist/sources";

type WaitlistFormProps = {
  source: WaitlistSource;
  className?: string;
  /** Larger padding on band/footer variants */
  variant?: "inline" | "panel";
  analyticsContext?: Record<string, string | number | boolean | null>;
};

export function WaitlistForm({
  source,
  className,
  variant = "inline",
  analyticsContext,
}: WaitlistFormProps) {
  const t = useTranslations("Waitlist");
  const locale = useLocale();
  const posthog = usePostHog();
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">(
    "idle",
  );
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const submitLock = useRef(false);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (submitLock.current) return;
    submitLock.current = true;
    setErrorMessage(null);
    setStatus("loading");
    const form = e.currentTarget;
    const hp = new FormData(form).get("website");
    try {
      const res = await fetch(WAITLIST_API_PATH, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email,
          locale,
          source,
          website: typeof hp === "string" ? hp : "",
        }),
      });
      let data: { ok?: boolean; error?: string } = {};
      try {
        data = (await res.json()) as { ok?: boolean; error?: string };
      } catch {
        /* non-JSON error body */
      }
      if (!res.ok) {
        posthog?.capture(PostHogEvent.ELEVATE_WAITLIST_SUBMIT_FAILED, {
          source,
          locale,
          http_status: res.status,
          ...analyticsContext,
        });
        setStatus("error");
        setErrorMessage(data.error ?? t("errorGeneric"));
        return;
      }
      posthog?.capture(PostHogEvent.ELEVATE_WAITLIST_SUBMITTED, {
        source,
        locale,
        ...analyticsContext,
      });
      setStatus("success");
      setEmail("");
    } catch {
      posthog?.capture(PostHogEvent.ELEVATE_WAITLIST_SUBMIT_FAILED, {
        source,
        locale,
        http_status: 0,
        ...analyticsContext,
      });
      setStatus("error");
      setErrorMessage(t("errorGeneric"));
    } finally {
      submitLock.current = false;
    }
  }

  if (status === "success") {
    return (
      <p
        className={cn(
          "text-sm text-vermilion-600",
          variant === "panel" && "text-vermilion-600",
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
            <Input
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
                variant === "panel" &&
                  "border-paper-50/25 bg-paper-50/10 text-paper-50 placeholder:text-paper-50/60 focus:border-paper-50/45 focus-visible:outline-paper-50 dark:border-ink-300 dark:bg-paper-100 dark:text-ink-900 dark:placeholder:text-ink-500 dark:focus:border-ink-700 dark:focus-visible:outline-ink-700",
              )}
            />
            <p
              className={cn(
                "mt-1.5 text-xs text-ink-500",
                variant === "panel" && "text-paper-50/70 dark:text-ink-700",
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
                "border border-paper-50/45 bg-paper-50 text-ink-900 hover:bg-paper-100 focus-visible:outline-paper-50 dark:border-ink-900 dark:bg-ink-900 dark:text-paper-50 dark:hover:bg-ink-700 dark:focus-visible:outline-ink-900",
            )}
            isLoading={status === "loading"}
          >
            {t("submit")}
          </Button>
        </div>
        {status === "error" && errorMessage && (
          <p className="text-sm text-vermilion-600" role="alert">
            {errorMessage}
          </p>
        )}
      </form>
    </div>
  );
}
