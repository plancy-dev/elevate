"use client";

import { useTransition } from "react";
import { useLocale, useTranslations } from "next-intl";
import { usePathname, useRouter } from "@/i18n/navigation";
import { routing } from "@/i18n/routing";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";

const localeOrder = routing.locales;

export function LanguageSwitcher({ className }: { className?: string }) {
  const t = useTranslations("LanguageSwitcher");
  const locale = useLocale();
  const router = useRouter();
  const pathname = usePathname();
  const [pending, startTransition] = useTransition();

  function onChange(next: string) {
    if (next === locale) return;
    startTransition(() => {
      router.replace(pathname, { locale: next });
    });
  }

  return (
    <div className={cn("flex min-w-0 items-center", className)}>
      <Select
        value={locale}
        onValueChange={onChange}
        disabled={pending}
      >
        <SelectTrigger
          aria-label={t("label")}
          className="w-full min-w-[7rem] max-w-[min(100%,11rem)]"
        >
          <SelectValue placeholder={t("label")} />
        </SelectTrigger>
        <SelectContent align="start" sideOffset={4}>
          {localeOrder.map((loc) => (
            <SelectItem key={loc} value={loc}>
              {t(loc as "en" | "ko" | "zh-CN" | "zh-TW" | "ja")}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
