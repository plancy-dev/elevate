import type { ReactNode } from "react";

export function MarketingSection({
  title,
  description,
  children,
}: {
  title: string;
  description?: string;
  children?: ReactNode;
}) {
  return (
    <div className="elevate-marketing-shell py-12 sm:py-16">
      <h1 className="text-[length:var(--elevate-marketing-page-title-size)] font-semibold tracking-[-0.02em] text-text-primary">
        {title}
      </h1>
      {description && (
        <p className="mt-4 max-w-2xl text-[length:var(--elevate-marketing-lead-size)] leading-[var(--elevate-prose-body-leading)] text-text-secondary">
          {description}
        </p>
      )}
      {children && <div className="mt-8 sm:mt-10">{children}</div>}
    </div>
  );
}
