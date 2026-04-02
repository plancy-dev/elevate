import { getTranslations } from "next-intl/server";
import { translateActionErrorMessage } from "@/lib/i18n/translate-action-error";

type Props = {
  code: string;
  className?: string;
  role?: "alert" | "status";
};

/** Server-only: renders a localized `Dashboard.actionErrors` message for an action/onboarding code. */
export async function ActionErrorMessage({
  code,
  className = "text-sm text-danger",
  role = "alert",
}: Props) {
  const t = await getTranslations("Dashboard.actionErrors");
  return (
    <p className={className} role={role}>
      {translateActionErrorMessage(code, t)}
    </p>
  );
}
