import type { ReactNode } from "react";
import { Link } from "@/i18n/navigation";
import {
  buttonLinkClassName,
  type ButtonSize,
  type ButtonVariant,
} from "@/components/ui/button";

type Props = {
  href: string;
  variant?: ButtonVariant;
  size?: ButtonSize;
  className?: string;
  children: ReactNode;
  onClick?: () => void;
};

export function IntlButtonLink({
  href,
  variant = "primary",
  size = "md",
  className,
  children,
  onClick,
}: Props) {
  return (
    <Link
      href={href}
      onClick={onClick}
      className={buttonLinkClassName(variant, size, className)}
    >
      {children}
    </Link>
  );
}
