import { Clapperboard } from "lucide-react";
import { ButtonLink } from "@/components/ui/button";

type Props = {
  title: string;
  body: string;
  ctaHref: string;
  ctaLabel: string;
};

/**
 * Empty queue — dashed surface, single primary CTA (VISUAL_LANGUAGE depth budget).
 */
export function ProductionsEmptyQueue({ title, body, ctaHref, ctaLabel }: Props) {
  return (
    <div className="rounded-[var(--radius-1)] border border-dashed border-ink-100 bg-paper-50/30 px-6 py-12 text-center sm:px-10">
      <div className="mx-auto flex max-w-sm flex-col items-center gap-4">
        <div
          className="flex h-12 w-12 items-center justify-center rounded-[var(--radius-1)] border border-ink-100 bg-paper-0 text-ink-500"
          aria-hidden
        >
          <Clapperboard className="h-6 w-6 opacity-90" />
        </div>
        <div className="space-y-2">
          <h2 className="text-base font-semibold tracking-tight text-ink-900">{title}</h2>
          <p className="text-sm leading-relaxed text-ink-700">{body}</p>
        </div>
        <ButtonLink href={ctaHref} variant="primary" size="md" className="mt-1 w-full max-w-xs sm:w-auto">
          {ctaLabel}
        </ButtonLink>
      </div>
    </div>
  );
}
