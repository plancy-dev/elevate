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
    <div className="mx-auto max-w-[1584px] px-4 py-16 lg:px-8">
      <h1 className="text-3xl font-semibold tracking-[-0.02em] text-text-primary lg:text-4xl">
        {title}
      </h1>
      {description && (
        <p className="mt-4 max-w-2xl text-sm text-text-secondary leading-relaxed">
          {description}
        </p>
      )}
      {children && <div className="mt-10">{children}</div>}
    </div>
  );
}
